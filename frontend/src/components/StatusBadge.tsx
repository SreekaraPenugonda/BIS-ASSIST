import { Badge } from "@/components/ui/badge";

/** Maps backend + lifecycle status strings to badge variants. */
export function statusVariant(
  status: string
): "default" | "secondary" | "success" | "warning" | "destructive" | "muted" | "saffron" {
  const key = (status ?? "").toLowerCase();
  if (key.includes("approv") || key.includes("compliant") || key === "product_specific") return "success";
  if (key.includes("verification_required") || key.includes("verification required") || key.includes("recheck")) return "warning";
  if (key.includes("reject") || key === "not_found") return "destructive";
  if (key.includes("info")) return "muted";
  if (key.includes("testing") || key.includes("review")) return "saffron";
  return "secondary";
}

export function statusLabel(status: string): string {
  if (!status) return "—";
  const key = status.toLowerCase();
  if (key === "product_specific") return "Product Specific";
  if (key === "verification_required") return "Verification Required";
  if (key === "not_found") return "Not Found";
  if (key === "info") return "Information";
  return status;
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant={statusVariant(status)} className={className}>
      <span
        className="h-1.5 w-1.5 rounded-full opacity-80"
        style={{ backgroundColor: "currentColor" }}
      />
      {statusLabel(status)}
    </Badge>
  );
}