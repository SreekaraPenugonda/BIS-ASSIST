import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";
import { cn } from "@/lib/utils";

const Tabs = React.forwardRef(function Tabs(
  { className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>,
  forwardedRef: React.Ref<HTMLDivElement>
) {
  return (
    <TabsPrimitive.Root
      ref={forwardedRef}
      className={cn("flex flex-col", className)}
      {...props}
    />
  );
});

const TabsList = React.forwardRef(function TabsList(
  { className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
  forwardedRef: React.Ref<HTMLDivElement>
) {
  return (
    <TabsPrimitive.List
      ref={forwardedRef}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  );
});

const TabsTrigger = React.forwardRef(function TabsTrigger(
  { className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
  forwardedRef: React.Ref<HTMLButtonElement>
) {
  return (
    <TabsPrimitive.Trigger
      ref={forwardedRef}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className
      )}
      {...props}
    />
  );
});

const TabsContent = React.forwardRef(function TabsContent(
  { className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>,
  forwardedRef: React.Ref<HTMLDivElement>
) {
  return (
    <TabsPrimitive.Content
      ref={forwardedRef}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  );
});

export { Tabs, TabsList, TabsTrigger, TabsContent };