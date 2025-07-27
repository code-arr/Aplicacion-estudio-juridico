import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils"; // asegurate de tener esta util

const SegmentedToggle = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn(
      "inline-flex w-full max-w-md justify-self-center items-center rounded-md bg-[hsl(210,40%,96.1%)] p-1 px-2 gap-x-1",
      className
    )}
    {...props}
  />
));
SegmentedToggle.displayName = ToggleGroupPrimitive.Root.displayName;

const SegmentedToggleItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cn(
      "flex-1 px-4 py-2 text-center text-sm font-medium text-[hsl(225,15%,15%)] hover:bg-[hsl(210,100%,97%)] data-[state=on]:bg-[hsl(210,100%,45%)] data-[state=on]:text-white rounded-md transition-colors",
      className
    )}
    {...props}
  />
));
SegmentedToggleItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { SegmentedToggle, SegmentedToggleItem };
