import type { ComponentPropsWithoutRef, PropsWithChildren } from "react";
import { cn } from "./cn";

const badgeClass =
  "inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--panel-2)] px-2.5 py-1 text-xs text-[var(--fg)]";

type BadgeProps = PropsWithChildren<{
  className?: string;
  as?: "span" | "button";
}> &
  (
    | (Omit<ComponentPropsWithoutRef<"span">, "className" | "children"> & { as?: "span" })
    | (Omit<ComponentPropsWithoutRef<"button">, "className" | "children"> & { as: "button" })
  );

export function Badge({ children, className, as, ...rest }: BadgeProps) {
  if (as === "button") {
    const btn = rest as ComponentPropsWithoutRef<"button">;
    const { type = "button", ...btnRest } = btn;
    return (
      <button
        type={type}
        className={cn(
          badgeClass,
          "cursor-pointer select-none text-left font-[inherit] transition-[transform,box-shadow,border-color] duration-200",
          className
        )}
        {...btnRest}
      >
        {children}
      </button>
    );
  }
  return (
    <span className={cn(badgeClass, className)} {...(rest as ComponentPropsWithoutRef<"span">)}>
      {children}
    </span>
  );
}
