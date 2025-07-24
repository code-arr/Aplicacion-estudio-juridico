import { cn } from "@/lib/utils";
import React from "react";

export function StaticSidebar({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <aside
      className={cn(
        "w-64 min-h-screen flex flex-col border-r border-[hsl(216,12%,15%)] bg-[hsl(216,12%,8%)]",
        className
      )}
    >
      {children}
    </aside>
  );
}
