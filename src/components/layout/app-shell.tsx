import { BottomNavigation } from "./bottom-navigation";
import { DesktopNavigation } from "./desktop-navigation";
import { NetworkStatus } from "@/components/feedback/network-status";
import { NetworkStatusProvider } from "@/providers/network-status-provider";
export function AppShell({ children, isConfigured }: { children: React.ReactNode; isConfigured: boolean }) {
  return <NetworkStatusProvider><NetworkStatus /><DesktopNavigation /><div className="min-h-dvh md:pl-64">{!isConfigured && <div className="border-b border-amber-900/40 bg-amber-950/20 px-4 py-2 text-center text-xs text-amber-300/80">Supabase 未配置·当前为基础界面预览</div>}<main className="mx-auto w-full max-w-5xl px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-8 sm:px-8 sm:pt-12 md:pb-16 lg:px-12">{children}</main></div><BottomNavigation /></NetworkStatusProvider>;
}
