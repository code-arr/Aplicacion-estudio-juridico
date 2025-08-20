// components/ui/dropdown-menu.tsx
import * as React from "react";
import * as RDMenu from "@radix-ui/react-dropdown-menu";

// Utilidad mínima para clases (evita depender de clsx/tw-merge)
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** ─────────────────────────────────────────────────────────────
 * API “propia” simple:
 * - Content: size ("1" | "2"), variant ("solid" | "soft"), color, highContrast, align, sideOffset
 * - Item: shortcut?, color?, asChild?
 * - Re-export de Sub, Label, Separator
 * ─────────────────────────────────────────────────────────────*/

type Size = "1" | "2";
type Variant = "solid" | "soft";
type Color =
  | "gray"
  | "indigo"
  | "cyan"
  | "orange"
  | "crimson"
  | "red"
  | "green"
  | "blue";

const sizeMap: Record<Size, string> = {
  "1": "text-sm py-1",
  "2": "text-base py-1.5",
};

const itemSizePaddingMap: Record<Size, string> = {
  "1": "px-3 h-8",
  "2": "px-3 h-9",
};

// Colores por variant (ajustá a tu paleta si querés)
const variantColorMap = ({
  variant,
  color,
  highContrast,
}: {
  variant: Variant;
  color?: Color;
  highContrast?: boolean;
}) => {
  // defaults neutrales
  if (!color) {
    return variant === "solid" ? "bg-gray-50" : "bg-white";
  }

  const isHC = highContrast ? " ring-1 ring-black/5" : "";

  // podés tunear estos hsl a tu paleta
  const map: Record<Variant, Record<Color, string>> = {
    solid: {
      gray: `bg-gray-50${isHC}`,
      indigo: `bg-[hsl(228,100%,97%)]${isHC}`,
      cyan: `bg-[hsl(190,100%,96%)]${isHC}`,
      orange: `bg-[hsl(28,100%,96%)]${isHC}`,
      crimson: `bg-[hsl(350,100%,96%)]${isHC}`,
      red: `bg-[hsl(0,100%,96%)]${isHC}`,
      green: `bg-[hsl(148,80%,96%)]${isHC}`,
      blue: `bg-[hsl(210,100%,96%)]${isHC}`,
    },
    soft: {
      gray: `bg-white${isHC}`,
      indigo: `bg-white${isHC}`,
      cyan: `bg-white${isHC}`,
      orange: `bg-white${isHC}`,
      crimson: `bg-white${isHC}`,
      red: `bg-white${isHC}`,
      green: `bg-white${isHC}`,
      blue: `bg-white${isHC}`,
    },
  };

  return map[variant][color];
};

const contentBase =
  "min-w-40 rounded-lg border border-gray-200 shadow-md drop-shadow-sm p-1 z-50";

const itemBase =
  "relative flex w-full select-none items-center justify-between rounded-md outline-none cursor-pointer " +
  "data-[highlighted]:bg-gray-100 data-[state=open]:bg-gray-100 data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed";

const rightSlot =
  "ml-6 pl-4 text-xs opacity-60 group-data-[highlighted]:opacity-80";

// ── Root
export const DropdownMenuRoot = RDMenu.Root;

// ── Trigger (podés usar asChild para botón propio)
export const DropdownMenuTrigger = RDMenu.Trigger;

// ── Iconito opcional para el trigger
export function DropdownMenuTriggerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M5 7l5 5 5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Content (con Portal)
type ContentProps = React.ComponentPropsWithoutRef<typeof RDMenu.Content> & {
  size?: Size;
  variant?: Variant;
  color?: Color;
  highContrast?: boolean;
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof RDMenu.Content>,
  ContentProps
>(function DropdownMenuContent(
  {
    size = "1",
    variant = "soft",
    color = "gray",
    highContrast,
    align = "end",
    sideOffset = 6,
    className,
    ...props
  },
  ref
) {
  return (
    <RDMenu.Portal>
      <RDMenu.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          contentBase,
          sizeMap[size],
          variantColorMap({ variant, color, highContrast }),
          className
        )}
        {...props}
      />
    </RDMenu.Portal>
  );
});

// ── Item
type ItemProps = React.ComponentPropsWithoutRef<typeof RDMenu.Item> & {
  shortcut?: string;
  color?: Color;
  size?: Size;
};

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof RDMenu.Item>,
  ItemProps
>(function DropdownMenuItem(
  { className, shortcut, color, size = "1", children, ...props },
  ref
) {
  const danger =
    color === "crimson" || color === "red"
      ? "text-red-600 data-[highlighted]:bg-red-50"
      : "";

  return (
    <RDMenu.Item
      ref={ref}
      className={cn(itemBase, itemSizePaddingMap[size], danger, className)}
      {...props}
    >
      <span className="pr-2 truncate">{children}</span>
      {shortcut ? <span className={rightSlot}>{shortcut}</span> : null}
    </RDMenu.Item>
  );
});

// ── Label
export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof RDMenu.Label>,
  React.ComponentPropsWithoutRef<typeof RDMenu.Label>
>(function DropdownMenuLabel({ className, ...props }, ref) {
  return (
    <RDMenu.Label
      ref={ref}
      className={cn(
        "px-3 py-1.5 text-xs uppercase tracking-wide opacity-60",
        className
      )}
      {...props}
    />
  );
});

// ── Separator
export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof RDMenu.Separator>,
  React.ComponentPropsWithoutRef<typeof RDMenu.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <RDMenu.Separator
      ref={ref}
      className={cn("my-1 h-px bg-gray-200", className)}
      {...props}
    />
  );
});

// ── Sub
export const DropdownMenuSub = RDMenu.Sub;

export const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof RDMenu.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof RDMenu.SubTrigger> & { size?: Size }
>(function DropdownMenuSubTrigger({ className, size = "1", ...props }, ref) {
  return (
    <RDMenu.SubTrigger
      ref={ref}
      className={cn(itemBase, itemSizePaddingMap[size], className)}
      {...props}
    />
  );
});

export const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof RDMenu.SubContent>,
  React.ComponentPropsWithoutRef<typeof RDMenu.SubContent> & { size?: Size }
>(function DropdownMenuSubContent(
  { className, size = "1", sideOffset = 6, ...props },
  ref
) {
  return (
    <RDMenu.SubContent
      ref={ref}
      sideOffset={sideOffset}
      className={cn(contentBase, sizeMap[size], "bg-white", className)}
      {...props}
    />
  );
});
