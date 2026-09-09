import * as LabelPrimitive from "@radix-ui/react-label";
import * as React from "react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef(function Label(
  { className, ...props }: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
  forwardedRef: React.Ref<HTMLLabelElement>
) {
  return (
    <LabelPrimitive.Root
      ref={forwardedRef}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  );
});

export { Label };