import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
type EmailOtpType = "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email";
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const supabase = await createClient();
  if (tokenHash && type && supabase) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}/`);
  }
  return NextResponse.redirect(`${origin}/login?error=confirmation`);
}
