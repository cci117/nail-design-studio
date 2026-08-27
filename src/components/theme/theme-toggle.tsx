"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { chipStyles } from "@/components/ui/button";

type Theme = "dark" | "light";
const themeEvent = "nail-theme-change";
function subscribe(listener: () => void) { window.addEventListener(themeEvent, listener); return () => window.removeEventListener(themeEvent, listener); }
function snapshot(): Theme { return document.documentElement.dataset.theme === "light" ? "light" : "dark"; }
function serverSnapshot(): Theme { return "dark"; }

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  useEffect(() => { window.dispatchEvent(new Event(themeEvent)); }, []);
  function apply(next: Theme) {
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("nail-theme", next); } catch { /* Theme still works when storage is unavailable. */ }
    window.dispatchEvent(new Event(themeEvent));
  }
  return <div className="grid grid-cols-2 gap-2" role="group" aria-label="外观主题">
    <button suppressHydrationWarning type="button" aria-pressed={theme === "dark"} onClick={() => apply("dark")} className={chipStyles(theme === "dark", "rounded-xl")}><Moon className="size-4"/>深色</button>
    <button suppressHydrationWarning type="button" aria-pressed={theme === "light"} onClick={() => apply("light")} className={chipStyles(theme === "light", "rounded-xl")}><Sun className="size-4"/>浅色</button>
  </div>;
}
