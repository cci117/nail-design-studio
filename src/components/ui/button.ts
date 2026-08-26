export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "default" | "compact" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary: "border !border-[#f5f5f5] !bg-[#f5f5f5] !text-black hover:!bg-white active:!border-[#d4d4d4] active:!bg-[#d4d4d4] disabled:!border-[#3a3a3a] disabled:!bg-[#242424] disabled:!text-[#b8b8b8]",
  secondary: "border !border-[#4a4a4a] !bg-[#1a1a1a] !text-white hover:!border-[#666] hover:!bg-[#242424] active:!bg-[#303030] disabled:!border-[#383838] disabled:!bg-[#202020] disabled:!text-[#b0b0b0]",
  ghost: "border !border-transparent !bg-transparent !text-[#f5f5f5] hover:!bg-[#1a1a1a] active:!bg-[#2a2a2a] disabled:!text-[#a3a3a3]",
  danger: "border !border-[#a84450] !bg-[#290d11] !text-[#ffb4bd] hover:!border-[#cf5966] hover:!bg-[#381116] active:!bg-[#4a171e] disabled:!border-[#593037] disabled:!bg-[#211012] disabled:!text-[#c58c93]",
};

const sizes: Record<ButtonSize, string> = {
  default: "min-h-11 px-5",
  compact: "min-h-11 px-3",
  icon: "size-11 p-0",
};

export function buttonStyles({ variant = "primary", size = "default", className = "" }: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return `inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium opacity-100 transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-100 disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`;
}

export function chipStyles(selected: boolean, className = "") {
  return `inline-flex min-h-11 max-w-full items-center justify-center gap-1.5 rounded-full border px-4 text-sm font-medium opacity-100 transition-colors active:scale-[0.98] disabled:opacity-100 ${selected ? "border-[#f5f5f5] bg-[#f5f5f5] text-black active:bg-[#d4d4d4]" : "border-[#525252] bg-[#181818] text-white active:border-[#777] active:bg-[#303030]"} ${className}`;
}
