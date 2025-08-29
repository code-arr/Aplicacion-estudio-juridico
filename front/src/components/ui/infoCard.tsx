// components/ui/stat-card.tsx
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type InfoCardProps = {
  title: string;
  value?: React.ReactNode;
  titleSize?: "sm" | "base" | "lg" | "xl";
  className?: string;
  children?: React.ReactNode;
};

export default function InfoCard({
  title,
  titleSize = "lg",
  className,
  children,
}: InfoCardProps) {
  return (
    <Card
      className={cn(
        `${className} p-4 border-[1.6px] border-gray-200 shadow-none`
      )}
    >
      <div className="flex flex-col justify-between">
        <h1
          className={cn(
            "text-gray-950 font-medium mb-1.5",
            titleSize === "lg" ? "text-lg" : "text-xl"
          )}
        >
          {title}
        </h1>
        {children}
      </div>
    </Card>
  );
}
