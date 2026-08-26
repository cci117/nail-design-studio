export interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
  mimeType: "image/jpeg";
}

const MAX_EDGE = 2200;
const JPEG_QUALITY = 0.88;

export function isHeic(file: File) {
  return /image\/(heic|heif)/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
}

export function isSupportedImage(file: File) {
  return /^image\/(jpeg|png|webp)$/i.test(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
}

export async function compressImage(file: File): Promise<ProcessedImage> {
  let source: CanvasImageSource;
  let sourceWidth: number;
  let sourceHeight: number;
  let cleanup: () => void = () => undefined;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    source = bitmap;
    sourceWidth = bitmap.width;
    sourceHeight = bitmap.height;
    cleanup = () => bitmap.close();
  } catch {
    const url = URL.createObjectURL(file);
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("无法解码图片。"));
      element.src = url;
    });
    source = image;
    sourceWidth = image.naturalWidth;
    sourceHeight = image.naturalHeight;
    cleanup = () => URL.revokeObjectURL(url);
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) { cleanup(); throw new Error("当前浏览器无法处理图片。"); }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);
  cleanup();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
  if (!blob) throw new Error("图片压缩失败，请重试。");
  return { blob, width, height, mimeType: "image/jpeg" };
}
