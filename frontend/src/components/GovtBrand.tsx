export function GovtBrand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5" aria-label="Government of India and Bureau of Indian Standards">
      <img src="/Bureau_of_Indian_Standards_Logo.svg" alt="Bureau of Indian Standards logo" className="h-9 w-12 shrink-0 object-contain sm:h-10 sm:w-14" />
      <span className="hidden min-w-0 text-left min-[360px]:block">
        <span className="block truncate text-[10px] font-bold uppercase tracking-wide text-primary sm:text-[11px]">Bureau of Indian Standards</span>
        {!compact && <span className="hidden truncate text-[10px] text-muted-foreground sm:block">Ministry of Consumer Affairs · Government of India</span>}
      </span>
    </span>
  );
}