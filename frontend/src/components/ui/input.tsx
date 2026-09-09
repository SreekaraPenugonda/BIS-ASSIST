import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: { default: "", sm: "h-8 text-xs", lg: "h-10" },
    },
    defaultVariants: { size: "default" },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

export const Input = React.forwardRef(function Input(
  { className, size, ...props }: InputProps,
  forwardedRef: React.Ref<HTMLInputElement>
) {
  return (
    <input
      ref={forwardedRef}
      className={cn(inputVariants({ size }), className)}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef(function Textarea(
  { className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  forwardedRef: React.Ref<HTMLTextAreaElement>
) {
  return (
    <textarea
      ref={forwardedRef}
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      rows={3}
      {...props}
    />
  );
});