"use client";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
export function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className={buttonStyles({ className: "h-12 w-full sm:w-auto sm:min-w-32" })}>{pending && <LoaderCircle size={16} className="animate-spin" />}{pending ? "保存中…" : label}</button>;
}
