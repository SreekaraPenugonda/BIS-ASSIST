import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef(function Card(
  { className, ...props }: React.HTMLAttributes<HTMLDivElement>,
  forwardedRef: React.Ref<HTMLDivElement>
) {
  return (
    <div
      ref={forwardedRef}
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  );
});

export const CardHeader = React.forwardRef(function CardHeader(
  { className, ...props }: React.HTMLAttributes<HTMLDivElement>,
  forwardedRef: React.Ref<HTMLDivElement>
) {
  return (
    <div ref={forwardedRef} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  );
});

export const CardTitle = React.forwardRef(function CardTitle(
  { className, ...props }: React.HTMLAttributes<HTMLHeadingElement>,
  forwardedRef: React.Ref<HTMLHeadingElement>
) {
  return (
    <h3 ref={forwardedRef} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  );
});

export const CardDescription = React.forwardRef(function CardDescription(
  { className, ...props }: React.HTMLAttributes<HTMLParagraphElement>,
  forwardedRef: React.Ref<HTMLParagraphElement>
) {
  return (
    <p ref={forwardedRef} className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
});

export const CardContent = React.forwardRef(function CardContent(
  { className, ...props }: React.HTMLAttributes<HTMLDivElement>,
  forwardedRef: React.Ref<HTMLDivElement>
) {
  return <div ref={forwardedRef} className={cn("p-6 pt-0", className)} {...props} />;
});

export const CardFooter = React.forwardRef(function CardFooter(
  { className, ...props }: React.HTMLAttributes<HTMLDivElement>,
  forwardedRef: React.Ref<HTMLDivElement>
) {
  return <div ref={forwardedRef} className={cn("flex items-center p-6 pt-0", className)} {...props} />;
});