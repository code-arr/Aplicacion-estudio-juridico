// src/components/ui/staticSidebar.tsx
import { cn } from "@/lib/utils";
import React from "react";

export function StaticSidebar({
  className,
  onTransitionEnd,
  children,
}: React.PropsWithChildren<{
  className?: string;
  onTransitionEnd?: () => void;
}>) {
  return (
    <aside
      className={cn(
        "w-64 shrink-0 min-h-screen flex flex-col border-r border-[hsl(216,12%,15%)] bg-[hsl(216,12%,8%)]",
        className
      )}
      onTransitionEnd={onTransitionEnd}
    >
      {children}
    </aside>
  );
}
