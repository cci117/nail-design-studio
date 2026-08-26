import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "美甲设计工作台", short_name: "美甲设计", description: "美甲资料管理与设计工作台",
    start_url: "/", display: "standalone", background_color: "#000000", theme_color: "#000000", lang: "zh-CN",
    icons: [{ src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }],
  };
}
