export function GovtBrand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2" aria-label="Government of India and Bureau of Indian Standards">
      <img src="/Bureau_of_Indian_Standards_Logo.svg" alt="Bureau of Indian Standards logo" className="h-10 w-14 shrink-0 object-contain" />
      <span className="min-w-0 text-left">
        <span className="block truncate text-[11px] font-bold uppercase tracking-wide text-primary">Bureau of Indian Standards</span>
        {!compact && <span className="block truncate text-[10px] text-muted-foreground">Ministry of Consumer Affairs · Government of India</span>}
      </span>
    </span>
  );
}