"use client";
import * as React from "react";
import { cn } from "./cn";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return (
      <select
        ref={ref}
        {...props}
        className={cn("uma-select", className)}
      />
    );
  },
);
