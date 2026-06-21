import { Copy, Check } from "lucide-react";
import { useState } from "react";
import JSONView from "@uiw/react-json-view";

const LONG_STRING_THRESHOLD = 300;

const jsonTheme = {
  "--w-rjv-font-family": "monospace",
  "--w-rjv-color": "#64748b",
  "--w-rjv-key-string": "#cbd5e1",
  "--w-rjv-background-color": "transparent",
  "--w-rjv-line-color": "transparent",
  "--w-rjv-arrow-color": "#64748b",
  "--w-rjv-edit-color": "#64748b",
  "--w-rjv-info-color": "#64748b",
  "--w-rjv-update-color": "#fbbf24",
  "--w-rjv-copied-color": "#22c55e",
  "--w-rjv-copied-success-color": "#22c55e",
  "--w-rjv-curlybraces-color": "#64748b",
  "--w-rjv-brackets-color": "#64748b",
  "--w-rjv-quotes-color": "#cbd5e1",
  "--w-rjv-quotes-string-color": "#f9a8d4",
  "--w-rjv-type-string-color": "#f9a8d4",
  "--w-rjv-type-int-color": "#93c5fd",
  "--w-rjv-type-float-color": "#86efac",
  "--w-rjv-type-bigint-color": "#93c5fd",
  "--w-rjv-type-boolean-color": "#86efac",
  "--w-rjv-type-date-color": "#93c5fd",
  "--w-rjv-type-url-color": "#93c5fd",
  "--w-rjv-type-null-color": "#fca5a5",
  "--w-rjv-type-nan-color": "#fca5a5",
  "--w-rjv-type-undefined-color": "#64748b",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className="btn btn-ghost btn-xs gap-1"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? (
        <Check className="w-3 h-3 text-success" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

function StringResult({ value }: { value: string }) {
  if (value.length > LONG_STRING_THRESHOLD) {
    return (
      <div className="space-y-2">
        <div className="flex justify-end">
          <CopyButton text={value} />
        </div>
        <pre className="bg-base-300 p-4 rounded-box overflow-auto max-h-96 text-xs leading-relaxed">
          <code>{value}</code>
        </pre>
      </div>
    );
  }

  return (
    <span className="badge badge-soft badge-info break-all whitespace-normal text-left">
      {value}
    </span>
  );
}

function PropertyTable({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) {
    return <span className="text-base-content/30 italic">Objeto vazio</span>;
  }

  const isSimple = entries.every(
    ([_, v]) =>
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean" ||
      v === null ||
      v === undefined,
  );

  if (isSimple) {
    return (
      <div className="rounded-box border border-base-300 divide-y divide-base-300">
        {entries.map(([key, value]) => (
          <div key={key} className="flex gap-4 p-3">
            <div className="w-32 font-medium text-sm text-base-content/70 truncate flex-shrink-0">
              {key}
            </div>
            <div className="flex-1 min-w-0">
              <ResultValue value={value} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <JSONView
      value={data as Record<string, object>}
      collapsed={2}
      displayDataTypes={false}
      enableClipboard={false}
      style={{ ...jsonTheme, fontSize: 13 } as React.CSSProperties}
    />
  );
}

function ArrayResult({ value }: { value: unknown[] }) {
  if (value.length === 0) {
    return <span className="text-base-content/30 italic">Array vazio</span>;
  }

  const allObjects = value.every(
    (item) => typeof item === "object" && item !== null && !Array.isArray(item),
  );

  const allPrimitives = value.every(
    (item) =>
      typeof item === "string" ||
      typeof item === "number" ||
      typeof item === "boolean" ||
      item === null ||
      item === undefined,
  );

  if (allObjects) {
    return (
      <div className="space-y-2">
        {value.map((item, i) => (
          <div
            key={i}
            className="rounded-box border border-base-300 overflow-hidden"
          >
            <div className="bg-base-200/50 px-3 py-1.5 text-xs font-mono text-base-content/50 border-b border-base-300">
              #{i}
            </div>
            <div className="p-2">
              <ResultValue value={item} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (allPrimitives) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((item, i) => (
          <span
            key={i}
            className="badge badge-soft badge-outline font-mono text-xs"
          >
            {String(item)}
          </span>
        ))}
      </div>
    );
  }

  return (
    <JSONView
      value={value as object[]}
      collapsed={2}
      displayDataTypes={false}
      enableClipboard={false}
      style={{ ...jsonTheme, fontSize: 13 } as React.CSSProperties}
    />
  );
}

export function ResultValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-base-content/30 italic">null</span>;
  }

  if (typeof value === "string") {
    return <StringResult value={value} />;
  }

  if (typeof value === "number") {
    return <span className="font-mono badge badge-soft badge-accent">{String(value)}</span>;
  }

  if (typeof value === "boolean") {
    return (
      <span className={`badge font-mono ${value ? "badge-success" : "badge-ghost"}`}>
        {String(value)}
      </span>
    );
  }

  if (Array.isArray(value)) {
    return <ArrayResult value={value} />;
  }

  if (typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>);

    if (keys.length <= 6) {
      return <PropertyTable data={value as Record<string, unknown>} />;
    }

    return (
      <JSONView
        value={value as Record<string, object>}
        collapsed={2}
        displayDataTypes={false}
        enableClipboard={false}
        style={{ ...jsonTheme, fontSize: 13 } as React.CSSProperties}
      />
    );
  }

  return <span className="font-mono text-xs">{JSON.stringify(value)}</span>;
}