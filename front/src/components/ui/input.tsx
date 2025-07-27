import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-[hsl(214.3,31.8%,91.4%)] bg-[hsl(0,0%,100%)] px-3 py-2 text-base ring-offset-[hsl(0,0%,100%)] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[hsl(222.2,84%,4.9%)] placeholder:text-[hsl(210,5%,78%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(210,100%,45%)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
