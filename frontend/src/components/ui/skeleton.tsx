import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const skeletonVariants = cva("animate-pulse rounded-md bg-muted", {
  variants: {
    shape: {
      default: "",
      circle: "rounded-full",
      card: "rounded-xl",
    },
  },
  defaultVariants: { shape: "default" },
});

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

export function Skeleton({
  className,
  shape,
  width,
  height,
  ...props
}: SkeletonProps & { width?: string; height?: string }) {
  return (
    <div
      className={cn(skeletonVariants({ shape }), className)}
      style={{ width: width ?? undefined, height: height ?? undefined }}
      {...props}
    />
  );
}