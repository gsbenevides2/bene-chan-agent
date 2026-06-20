import { Braces, Code2, Hash, List, ToggleLeft, Type } from "lucide-react";
import { parseSchema } from "./parseSchema";

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case "string":
      return <Type className="w-3 h-3" />;
    case "number":
    case "integer":
      return <Hash className="w-3 h-3" />;
    case "boolean":
      return <ToggleLeft className="w-3 h-3" />;
    case "array":
      return <List className="w-3 h-3" />;
    case "object":
      return <Braces className="w-3 h-3" />;
    default:
      return <Code2 className="w-3 h-3" />;
  }
}

export function ParamFields({
  schema,
  values,
  onChange,
}: {
  schema: Record<string, unknown>;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  const { properties } = parseSchema(schema);

  if (properties.length === 0) {
    return (
      <div className="text-sm text-base-content/50 italic">
        Esta ferramenta não requer parâmetros
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {properties.map((prop) => (
        <div key={prop.name}>
          <div className="flex items-center gap-1.5 mb-1">
            <TypeIcon type={prop.type} />
            <span className="font-mono font-semibold text-sm">{prop.name}</span>
            <span className="badge badge-sm badge-soft">{prop.type}</span>
            {prop.required && (
              <span className="text-error text-xs">*obrigatório</span>
            )}
          </div>
          {prop.description && (
            <p className="mb-1.5 text-xs text-base-content/50">
              {prop.description}
            </p>
          )}
          {prop.enum ? (
            <select
              className="w-full select-bordered select-sm select"
              value={values[prop.name] ?? ""}
              onChange={(e) => onChange(prop.name, e.target.value)}
            >
              <option value="">Selecione...</option>
              {prop.enum.map((opt) => (
                <option key={String(opt)} value={String(opt)}>
                  {String(opt)}
                </option>
              ))}
            </select>
          ) : prop.type === "boolean" ? (
            <div className="flex gap-2">
              <button
                className={`btn btn-sm flex-1 ${values[prop.name] === "true" ? "btn-primary" : "btn-ghost"}`}
                onClick={() =>
                  onChange(
                    prop.name,
                    values[prop.name] === "true" ? "" : "true",
                  )
                }
              >
                true
              </button>
              <button
                className={`btn btn-sm flex-1 ${values[prop.name] === "false" ? "btn-primary" : "btn-ghost"}`}
                onClick={() =>
                  onChange(
                    prop.name,
                    values[prop.name] === "false" ? "" : "false",
                  )
                }
              >
                false
              </button>
            </div>
          ) : prop.type === "number" || prop.type === "integer" ? (
            <input
              type="number"
              className="w-full input input-bordered input-sm"
              placeholder="0"
              value={values[prop.name] ?? ""}
              onChange={(e) => onChange(prop.name, e.target.value)}
            />
          ) : prop.type === "array" || prop.type === "object" ? (
            <textarea
              className="w-full font-mono text-xs textarea textarea-bordered textarea-sm"
              placeholder={
                prop.type === "array"
                  ? '["item1", "item2"]'
                  : '{"key": "value"}'
              }
              rows={2}
              value={values[prop.name] ?? ""}
              onChange={(e) => onChange(prop.name, e.target.value)}
            />
          ) : (
            <input
              type="text"
              className="w-full input input-bordered input-sm"
              placeholder="Digite o valor"
              value={values[prop.name] ?? ""}
              onChange={(e) => onChange(prop.name, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
