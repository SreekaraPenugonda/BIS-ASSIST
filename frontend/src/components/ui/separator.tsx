import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as React from "react";
import { cn } from "@/lib/utils";

const Separator = React.forwardRef(function Separator(
  {
    className,
    orientation = "horizontal",
    decorative = true,
    ...props
  }: React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>,
  forwardedRef: React.Ref<HTMLDivElement>
) {
  return (
    <SeparatorPrimitive.Root
      ref={forwardedRef}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-border",
        orientation === "horizontal" ? "h-px w-full shrink-0" : "h-full w-px shrink-0",
        className
      )}
      {...props}
    />
  );
});

export { Separator };