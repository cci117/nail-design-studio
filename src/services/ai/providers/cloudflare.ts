import "server-only";
import type { AiImageProviderAdapter } from "../provider";
import { aiError, failedGeneration } from "../errors";
import type { AiProviderCapabilities } from "../types";

export const CLOUDFLARE_FLUX_KLEIN_MODEL = "@cf/black-forest-labs/flux-2-klein-4b";
const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4/accounts";
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_REFERENCE_BYTES = 10 * 1024 * 1024;

const capabilities: AiProviderCapabilities = {
  supportsImageInput: true,
  maxReferenceImages: 4,
  supportsImageEditing: true,
  supportedOutputSizes: ["1024x1024", "1024x768", "768x1024"],
};

interface CloudflareEnvelope {
  success?: boolean;
  result?: { image?: string };
  errors?: Array<{ code?: number; message?: string }>;
}

function imageMimeType(base64: string) {
  if (base64.startsWith("iVBOR")) return "image/png";
  if (base64.startsWith("/9j/")) return "image/jpeg";
  if (base64.startsWith("UklGR")) return "image/webp";
  return null;
}

function httpError(status: number, payload: CloudflareEnvelope | null) {
  if (status === 429) return aiError("rate_limited", "Cloudflare Workers AI 请求频率受限。", true);
  const providerCode = payload?.errors?.[0]?.code;
  const suffix = typeof providerCode === "number" ? `，错误码 ${providerCode}` : "";
  return aiError("provider_http_error", `Cloudflare Workers AI 请求失败（HTTP ${status}${suffix}）。`, status >= 500);
}

function dataUrlBytes(value: string) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/=]+)$/i.exec(value);
  if (!match) throw new Error("invalid-reference-image");
  const buffer = Buffer.from(match[2], "base64");
  const bytes = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  return { contentType: match[1], bytes };
}

async function appendReferenceImages(form: FormData, images: Array<{ url?: string; dataUrl?: string }>, signal: AbortSignal) {
  for (const [index, image] of images.entries()) {
    let contentType: string;
    let bytes: ArrayBuffer | Uint8Array;
    if (image.dataUrl) {
      ({ contentType, bytes } = dataUrlBytes(image.dataUrl));
    } else {
      const url = new URL(image.url ?? "");
      if (url.protocol !== "https:") throw new Error("unsupported-reference-url");
      const response = await fetch(url, { signal, cache: "no-store" });
      if (!response.ok) throw new Error("reference-image-fetch-failed");
      contentType = response.headers.get("content-type")?.split(";")[0] ?? "";
      if (!contentType.startsWith("image/")) throw new Error("invalid-reference-image");
      bytes = await response.arrayBuffer();
    }
    if (bytes.byteLength > MAX_REFERENCE_BYTES) throw new Error("reference-image-too-large");
    form.append(`input_image_${index}`, new Blob([bytes], { type: contentType }), `reference-${index}`);
  }
}

export const cloudflareImageAdapter: AiImageProviderAdapter = {
  id: "cloudflare",
  isConfigured() {
    return Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN);
  },
  supportsModel(model) {
    return model === CLOUDFLARE_FLUX_KLEIN_MODEL;
  },
  capabilities(model) {
    if (!this.supportsModel(model)) return { supportsImageInput: false, maxReferenceImages: 0, supportsImageEditing: false, supportedOutputSizes: [] };
    return capabilities;
  },
  async generateConceptImage(request, model, generationId) {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const token = process.env.CLOUDFLARE_API_TOKEN;
    if (!accountId || !token) return failedGeneration(generationId, this.id, model, aiError("missing_credentials", "Cloudflare Workers AI 凭据未配置。"));
    if (!this.supportsModel(model)) return failedGeneration(generationId, this.id, model, aiError("unsupported_capability", "Cloudflare Adapter 不支持配置的模型。"));
    if (request.referenceImages.length > capabilities.maxReferenceImages) return failedGeneration(generationId, this.id, model, aiError("unsupported_capability", "参考图片数量超过模型限制。"));

    const [width, height] = (request.outputSize ?? "1024x1024").split("x");
    const prompt = [request.prompt, request.requirementText].map((value) => value.trim()).filter(Boolean).join("\n");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const form = new FormData();
      form.append("prompt", prompt);
      form.append("width", width);
      form.append("height", height);
      await appendReferenceImages(form, request.referenceImages, controller.signal);
      const endpoint = `${CLOUDFLARE_API_BASE}/${encodeURIComponent(accountId)}/ai/run/${model}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
        signal: controller.signal,
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null) as CloudflareEnvelope | null;
      if (!response.ok) return failedGeneration(generationId, this.id, model, httpError(response.status, payload));
      const base64 = payload?.result?.image;
      const mimeType = typeof base64 === "string" ? imageMimeType(base64) : null;
      if (!payload?.success || !base64 || !mimeType) return failedGeneration(generationId, this.id, model, aiError("invalid_response", "Cloudflare Workers AI 返回了无法识别的图片响应。"));
      return {
        generationId,
        provider: this.id,
        model,
        status: "succeeded",
        images: [{ id: `${generationId}-0`, base64, mimeType, width: Number(width), height: Number(height) }],
        usage: { imagesGenerated: 1 },
        error: null,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return failedGeneration(generationId, this.id, model, aiError("timeout", "Cloudflare Workers AI 请求超时。", true));
      if (error instanceof Error && ["reference-image-fetch-failed", "reference-image-too-large", "invalid-reference-image"].includes(error.message)) return failedGeneration(generationId, this.id, model, aiError("invalid_request", "参考图片无法读取或格式不受支持。"));
      if (error instanceof Error && error.message === "unsupported-reference-url") return failedGeneration(generationId, this.id, model, aiError("unsupported_capability", "参考图片必须使用 HTTPS 地址。"));
      return failedGeneration(generationId, this.id, model, aiError("provider_error", "Cloudflare Workers AI 暂时不可用。", true));
    } finally {
      clearTimeout(timeout);
    }
  },
};
