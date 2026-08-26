/**
 * Generates a UUID in browsers where randomUUID is unavailable, such as
 * non-secure local-network development origins. getRandomValues remains
 * cryptographically secure and is suitable for both temporary IDs and
 * unpredictable Storage object names.
 */
export function createClientId() {
  const browserCrypto = globalThis.crypto;

  if (typeof browserCrypto?.randomUUID === "function") {
    return browserCrypto.randomUUID();
  }

  if (typeof browserCrypto?.getRandomValues !== "function") {
    throw new Error("当前浏览器无法生成安全的图片标识，请升级浏览器后重试。");
  }

  const bytes = browserCrypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));

  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}
