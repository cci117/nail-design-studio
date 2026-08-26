import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase!.auth.getClaims();
    if (!data?.claims) redirect("/login");
  }
  return <AppShell isConfigured={isSupabaseConfigured}>{children}</AppShell>;
}
