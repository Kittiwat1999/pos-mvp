type BrandBadgeProps = {
  children?: string;
};

export function BrandBadge({ children = 'POS MVP' }: BrandBadgeProps) {
  return (
    <div className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
      {children}
    </div>
  );
}
