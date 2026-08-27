export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "default" | "compact" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary: "border border-primary bg-primary text-primary-foreground hover:brightness-110 active:brightness-90 disabled:border-border disabled:bg-surface-raised disabled:text-muted",
  secondary: "border border-border bg-secondary text-secondary-foreground hover:brightness-110 active:brightness-90 disabled:bg-surface-raised disabled:text-muted",
  ghost: "border border-transparent bg-transparent text-foreground hover:bg-surface-raised active:bg-secondary disabled:text-muted",
  danger: "border border-danger bg-danger-surface text-danger hover:brightness-110 active:brightness-90 disabled:border-border disabled:text-muted",
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
  return `inline-flex min-h-11 max-w-full items-center justify-center gap-1.5 rounded-full border px-4 text-sm font-medium opacity-100 transition-colors active:scale-[0.98] disabled:opacity-100 ${selected ? "border-primary bg-primary text-primary-foreground active:brightness-90" : "border-border bg-secondary text-secondary-foreground active:brightness-90"} ${className}`;
}

export function floatingAddStyles(className = "") {
  return buttonStyles({ className: `floating-add fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-5 z-30 min-h-14 rounded-full px-5 shadow-lg md:bottom-8 md:right-8 ${className}` });
}
