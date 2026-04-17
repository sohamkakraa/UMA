"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "./cn";

/* ─── Root & primitives ───────────────────────────────────── */
const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

/* ─── Overlay ─────────────────────────────────────────────── */
const SheetOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50",
      "data-[state=open]:animate-in data-[state=open]:fade-in-0",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

/* ─── Content (bottom sheet) ──────────────────────────────── */
interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: "top" | "bottom" | "left" | "right";
}

const sideClasses = {
  top: "inset-x-0 top-0 rounded-b-3xl border-b data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top",
  bottom: "inset-x-0 bottom-0 rounded-t-3xl border-t data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
  left: "inset-y-0 left-0 h-full w-3/4 max-w-sm rounded-r-3xl border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
  right: "inset-y-0 right-0 h-full w-3/4 max-w-sm rounded-l-3xl border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
};

const SheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = "bottom", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 bg-[var(--panel)] border-[var(--border)] shadow-xl transition ease-in-out",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        "duration-300",
        sideClasses[side],
        className,
      )}
      {...props}
    >
      {/* Handle bar for bottom/top sheets */}
      {(side === "bottom" || side === "top") && (
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1 w-12 rounded-full bg-[var(--border)]" />
        </div>
      )}
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-xl p-1.5 text-[var(--muted)] transition-colors hover:text-[var(--fg)] hover:bg-[var(--panel-2)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = "SheetContent";

/* ─── Header / Footer / Title / Description ───────────────── */
function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 px-4 sm:px-6 pt-2 pb-3", className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2 px-4 sm:px-6 pb-6", className)} {...props} />;
}

const SheetTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-[var(--fg)]", className)}
    {...props}
  />
));
SheetTitle.displayName = DialogPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-[var(--muted)]", className)}
    {...props}
  />
));
SheetDescription.displayName = DialogPrimitive.Description.displayName;

/* ─── Exports ─────────────────────────────────────────────── */
export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
