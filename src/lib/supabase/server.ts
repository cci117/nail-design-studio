import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "./config";
type CookieOptions = Parameters<Awaited<ReturnType<typeof cookies>>["set"]>[2];
type CookieToSet = { name: string; value: string; options: CookieOptions };
export async function createClient() {
  if (!isSupabaseConfigured) return null;
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { cookies: { getAll: () => store.getAll(), setAll(items: CookieToSet[]) { try { items.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* Proxy refreshes cookies when Server Components cannot. */ } } } });
}
