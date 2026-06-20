export function ResultValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-base-content/30 italic">null</span>;
  }

  if (typeof value === "string") {
    return (
      <span className="text-left break-all whitespace-normal badge badge-soft badge-info">
        {value}
      </span>
    );
  }

  if (typeof value === "number") {
    return (
      <span className="font-mono badge badge-soft badge-accent">{value}</span>
    );
  }

  if (typeof value === "boolean") {
    return (
      <span
        className={`badge font-mono ${value ? "badge-success" : "badge-ghost"}`}
      >
        {String(value)}
      </span>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div className="space-y-1">
        {value.map((item, i) => (
          <div key={i} className="flex gap-2">
            <span className="flex-shrink-0 mt-0.5 w-4 font-mono text-[11px] text-base-content/40">
              {i}.
            </span>
            <div className="flex-1 min-w-0">
              <ResultValue value={item} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return <span className="text-base-content/30 italic">Objeto vazio</span>;
    }
    return (
      <div className="space-y-1 bg-base-300/50 p-2 rounded-lg">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-start gap-2">
            <span className="flex-shrink-0 mt-0.5 font-mono font-semibold text-primary text-xs">
              {k}:
            </span>
            <div className="flex-1 min-w-0">
              <ResultValue value={v} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <span className="font-mono text-xs">{JSON.stringify(value)}</span>;
}
