import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-[hsl(0,0%,100%)] px-3 py-2 text-sm ring-offset-[hsl(0,0%,100%)] placeholder:text-[hsl(215.4,16.3%,46.9%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(210,100%,45%)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
