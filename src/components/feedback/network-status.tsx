"use client";
import { WifiOff } from "lucide-react";
import { useNetworkStatus } from "@/providers/network-status-provider";
export function NetworkStatus() {
  const { isOnline } = useNetworkStatus();
  if (isOnline) return null;
  return <div className="fixed inset-x-0 top-3 z-50 mx-auto flex w-fit items-center gap-2 rounded-full border border-border bg-surface-raised/95 px-3 py-1.5 text-xs text-zinc-300 shadow-xl backdrop-blur"><WifiOff size={13} />离线模式</div>;
}
