import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as React from "react";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const overlayVariants = cva(
  "fixed inset-0 z-50 bg-primary/35 transition-all backdrop-blur-sm",
  {
    variants: {
      animate: {
        in: "opacity-100 animate-fade-in",
        out: "opacity-0 animate-fade-out",
        none: "",
      },
    },
    defaultVariants: { animate: "in" },
  }
);

const contentVariants = cva(
  "fixed left-1/2 top-1/2 z-50 grid max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl border border-border bg-card p-6 text-card-foreground card-shadow-lg animate-zoom-in",
  {
    variants: {
      animate: {
        in: "",
        out: "animate-fade-out",
        none: "",
      },
      size: {
        default: "",
        sm: "sm:max-w-sm",
        lg: "max-w-2xl sm:max-w-2xl",
        xl: "max-w-5xl sm:max-w-5xl",
      },
    },
    defaultVariants: { animate: "in", size: "default" },
  }
);

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof contentVariants> {
  overlayClassName?: string;
}

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogPortal = DialogPrimitive.Portal;

const DialogOverlay = React.forwardRef(function DialogOverlay(
  { className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>,
  forwardedRef: React.Ref<HTMLDivElement>
) {
  return (
    <DialogPrimitive.Overlay
      ref={forwardedRef}
      className={cn(overlayVariants(), className)}
      {...props}
    />
  );
});

const DialogContent = React.forwardRef(function DialogContent(
  {
    className,
    overlayClassName,
    size,
    ...props
  }: DialogContentProps,
  forwardedRef: React.Ref<HTMLDivElement>
) {
  return (
    <DialogPortal>
      <DialogPrimitive.Overlay className={cn(overlayVariants(), overlayClassName)} />
      <DialogPrimitive.Content
        ref={forwardedRef}
        className={cn(contentVariants({ size }), className)}
        {...props}
      />
    </DialogPortal>
  );
});

const DialogTitle = React.forwardRef(function DialogTitle(
  { className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>,
  forwardedRef: React.Ref<HTMLHeadingElement>
) {
  return (
    <DialogPrimitive.Title
      ref={forwardedRef}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
});

const DialogDescription = React.forwardRef(function DialogDescription(
  { className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>,
  forwardedRef: React.Ref<HTMLParagraphElement>
) {
  return (
    <DialogPrimitive.Description
      ref={forwardedRef}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});

function DialogCloseButton({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>) {
  return (
    <DialogPrimitive.Close
      className={cn(
        "absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
        className
      )}
      aria-label="Close"
      {...props}
    >
      <X className="h-4 w-4" strokeWidth={2} />
    </DialogPrimitive.Close>
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogCloseButton,
};