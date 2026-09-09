import * as React from "react";
import { cn } from "@/lib/utils";

export const Table = React.forwardRef(function Table(
  { className, ...props }: React.HTMLAttributes<HTMLTableElement>,
  forwardedRef: React.Ref<HTMLTableElement>
) {
  return (
    <div className="relative w-full overflow-auto">
      <table ref={forwardedRef} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
});

export const TableHeader = React.forwardRef(function TableHeader(
  { className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>,
  forwardedRef: React.Ref<HTMLTableSectionElement>
) {
  return <thead ref={forwardedRef} className={cn("[&_tr]:border-b", className)} {...props} />;
});

export const TableBody = React.forwardRef(function TableBody(
  { className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>,
  forwardedRef: React.Ref<HTMLTableSectionElement>
) {
  return <tbody ref={forwardedRef} className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
});

export const TableRow = React.forwardRef(function TableRow(
  { className, ...props }: React.HTMLAttributes<HTMLTableRowElement>,
  forwardedRef: React.Ref<HTMLTableRowElement>
) {
  return (
    <tr
      ref={forwardedRef}
      className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)}
      {...props}
    />
  );
});

export const TableHead = React.forwardRef(function TableHead(
  { className, ...props }: React.HTMLAttributes<HTMLTableCellElement>,
  forwardedRef: React.Ref<HTMLTableCellElement>
) {
  return (
    <th
      ref={forwardedRef}
      className={cn("h-10 px-3 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  );
});

export const TableCell = React.forwardRef(function TableCell(
  { className, ...props }: React.HTMLAttributes<HTMLTableCellElement>,
  forwardedRef: React.Ref<HTMLTableCellElement>
) {
  return (
    <td ref={forwardedRef} className={cn("p-3 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
  );
});

export const TableCaption = React.forwardRef(function TableCaption(
  { className, ...props }: React.HTMLAttributes<HTMLTableCaptionElement>,
  forwardedRef: React.Ref<HTMLTableCaptionElement>
) {
  return <caption ref={forwardedRef} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />;
});