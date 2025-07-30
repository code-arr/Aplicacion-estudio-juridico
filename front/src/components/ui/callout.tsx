// components/ui/callout.tsx
import * as React from "react";
import { AlertCircle, Info, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type CalloutType = "info" | "warning" | "error";

const icons = {
  info: Info,
  warning: AlertCircle,
  error: ShieldAlert,
};

const baseColors = {
  info: "bg-blue-50 text-blue-800 border-l-4 border-blue-500",
  warning:
    "bg-yellow-50 text-yellow-800 border-l-4 border-yellow-500 text-[#665937]",
  error: "bg-red-50 text-red-800 border-l-4 border-red-500",
};

interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: CalloutType;
  icon?: React.ReactNode;
}

const Callout = React.forwardRef<HTMLDivElement, CalloutProps>(
  ({ className, children, type = "info", icon, ...props }, ref) => {
    const Icon = icons[type];

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start gap-3 my-1 p-4 py-2 rounded-md text-sm",
          baseColors[type],
          className
        )}
        {...props}
      >
        <div className="mt-1">{icon || <Icon className="w-5 h-5" />}</div>
        <div>{children}</div>
      </div>
    );
  }
);

Callout.displayName = "Callout";
export { Callout };
