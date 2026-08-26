"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
const NetworkContext = createContext({ isOnline: true });
export function NetworkStatusProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    update(); window.addEventListener("online", update); window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  return <NetworkContext.Provider value={useMemo(() => ({ isOnline }), [isOnline])}>{children}</NetworkContext.Provider>;
}
export const useNetworkStatus = () => useContext(NetworkContext);
