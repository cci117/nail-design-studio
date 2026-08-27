import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "美甲设计工作台", template: "%s · 美甲设计工作台" },
  description: "离线可用、支持多设备同步的美甲资料与设计工作台。",
  applicationName: "美甲设计工作台",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "美甲设计" },
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon.svg" },
  other: { nightmode: "disable" },
};

export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#000000" }, { media: "(prefers-color-scheme: light)", color: "#f7f7f5" }], colorScheme: "dark light", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN" data-theme="dark" suppressHydrationWarning><head><script id="theme-init" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('nail-theme');document.documentElement.dataset.theme=t==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}` }}/></head><body className="min-h-dvh bg-background text-foreground antialiased">{children}<ServiceWorkerRegistration /></body></html>;
}
