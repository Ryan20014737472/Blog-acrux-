interface PlaceholderMediaProps {
  label: string;
  className?: string;
}

export function PlaceholderMedia({ label, className }: PlaceholderMediaProps) {
  return (
    <div aria-label={label} className={`placeholder-media ${className ?? ""}`} role="img">
      <span className="max-w-full break-words">{label}</span>
    </div>
  );
}

