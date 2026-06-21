import { Code2, X, Play, CheckCircle, XCircle } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { getApiClient } from "../../utils/client";
import { JsonFormFields } from "./JsonFormFields";
import { ResultValue } from "./ResultValue";
import { ToolParam, ToolResult } from "./types";

export function ToolDrawer({
  tool,
  open,
  onClose,
}: {
  tool?: ToolParam;
  open: boolean;
  onClose: () => void;
}) {
  const [paramValues, setParamValues] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<ToolResult | null>(null);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleParamChange = useCallback((data: Record<string, unknown>) => {
    setParamValues(data);
  }, []);

  async function handleCall() {
    if (!tool) return;
    setLoading(true);
    setResult(null);
    try {
      const api = getApiClient();
      const res = await api.tools["call"].post({
        name: tool.name,
        args: Object.keys(paramValues).length > 0 ? paramValues : undefined,
        serverId: tool.source === "mcp" ? tool.serverId : undefined,
      });
      setResult(
        (res.data as ToolResult) ?? { success: false, error: "Sem resposta" },
      );
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : "Erro desconhecido",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  return (
    <div
      className={`fixed inset-0 z-50 transition-colors duration-300 ${
        open ? "bg-black/50 visible" : "bg-transparent pointer-events-none"
      }`}
      onClick={handleBackdropClick}
    >
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-base-100 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-base-300 border-b">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex flex-shrink-0 justify-center items-center bg-primary/20 rounded-lg w-9 h-9">
              <Code2 className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-base truncate">{tool?.name}</h2>
              <div className="flex items-center gap-2">
                <span
                  className={`badge badge-xs ${tool?.source === "system" ? "badge-primary" : "badge-soft badge-info"}`}
                >
                  {tool?.source === "system" ? "Sistema" : "MCP"}
                </span>
                {tool?.source === "mcp" && tool.serverName && (
                  <span className="text-xs text-base-content/50 truncate">
                    {tool.serverName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 btn btn-sm btn-circle btn-ghost"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 p-4 overflow-y-auto">
          <p className="text-sm text-base-content/70">{tool?.description}</p>

          <div>
            <h3 className="mb-2 font-semibold text-xs text-base-content/50 uppercase tracking-wider">
              Parâmetros
            </h3>
            {tool?.parameters ? (
              <JsonFormFields
                schema={tool?.parameters as Record<string, unknown>}
                data={paramValues}
                onChange={handleParamChange}
              />
            ) : null}
          </div>

          <button
            onClick={handleCall}
            className="w-full btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                Executando...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Executar
              </>
            )}
          </button>

          {result && (
            <div
              className={`rounded-lg border text-sm ${
                result.success
                  ? "bg-success/10 border-success/30"
                  : "bg-error/10 border-error/30"
              }`}
            >
              <div
                className={`flex items-center gap-2 px-3 py-2.5 border-b font-semibold text-xs ${
                  result.success
                    ? "border-success/30 text-success"
                    : "border-error/30 text-error"
                }`}
              >
                {result.success ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {result.success ? "Sucesso" : "Erro"}
              </div>
              <div className="p-3">
                {result.success ? (
                  <ResultValue value={result.result} />
                ) : (
                  <span className="text-error">{result.error}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
