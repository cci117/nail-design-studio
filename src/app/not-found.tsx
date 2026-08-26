import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
export default function NotFound() { return <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-black text-center"><p className="text-xs tracking-widest text-zinc-500">404</p><h1 className="text-xl font-medium">页面不存在</h1><Link href="/" className={buttonStyles({ variant: "secondary" })}>返回首页</Link></div>; }
