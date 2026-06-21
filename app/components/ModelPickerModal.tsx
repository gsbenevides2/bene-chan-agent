"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Search, X, Cpu, ArrowRight } from "lucide-react";
import { getApiClient } from "@/app/utils/client";

interface ModelResult {
  id: string;
  name: string;
  provider: string;
}

interface ModelPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSessionId?: string | null;
  onSelect?: (model: ModelResult) => void;
  title?: string;
}

export default function ModelPickerModal({
  isOpen,
  onClose,
  currentSessionId,
  onSelect,
  title = "Trocar Modelo",
}: ModelPickerModalProps) {
  const [models, setModels] = useState<ModelResult[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setSearchTerm("");
      setSelectedIndex(0);
      const api = getApiClient();
      api.models
        .get()
        .then((response) => {
          if (!response.error && response.data) {
            setModels(response.data as unknown as ModelResult[]);
          }
        })
        .catch(() => setModels([]))
        .finally(() => setIsLoading(false));
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const filteredModels = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return models;
    return models.filter(
      (m) =>
        m.name.toLowerCase().includes(search) ||
        m.provider.toLowerCase().includes(search) ||
        m.id.toLowerCase().includes(search),
    );
  }, [models, searchTerm]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredModels.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredModels.length - 1,
          );
          break;
        case "Enter":
          e.preventDefault();
          if (filteredModels[selectedIndex]) {
            const model = filteredModels[selectedIndex];
            if (onSelect) {
              onSelect(model);
              onClose();
            } else if (currentSessionId) {
              const api = getApiClient();
              api
                .chat({ sessionId: currentSessionId })
                .model.put({ model: model.id })
                .then(() => onClose())
                .catch(() => onClose());
            }
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredModels, currentSessionId, onClose]);

  return (
    <dialog className={`modal ${isOpen ? "modal-open" : ""}`}>
      <div className="w-11/12 max-w-xl modal-box">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5" />
            <h3 className="font-semibold text-lg">{title}</h3>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="top-1/2 left-3 absolute w-4 h-4 text-base-content/70 -translate-y-1/2 transform" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar modelo por nome ou provedor..."
            className="pl-10 w-full input input-bordered"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-base-content/70 text-center">
              <span className="loading loading-spinner loading-md" />
              <p className="mt-2">Carregando modelos...</p>
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="py-8 text-base-content/70 text-center">
              <Cpu className="opacity-50 mx-auto mb-2 w-12 h-12" />
              <p>Nenhum modelo encontrado</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredModels.map((model, index) => (
                <button
                  key={model.id}
                  onClick={() => {
                    if (onSelect) {
                      onSelect(model);
                      onClose();
                    } else if (currentSessionId) {
                      const api = getApiClient();
                      api
                        .chat({ sessionId: currentSessionId })
                        .model.put({ model: model.id })
                        .then(() => onClose())
                        .catch(() => onClose());
                    }
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left p-3 rounded-lg transition-colors duration-150 ${selectedIndex === index ? "bg-base-300" : ""}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <Cpu className="w-4 h-4 text-base-content/70" />
                      <div>
                        <div className="font-medium">{model.name}</div>
                        <div className="text-sm text-base-content/70">
                          {model.provider}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-base-200 px-2 py-0.5 rounded-full text-xs text-base-content/60">
                        {model.id}
                      </span>
                      <ArrowRight
                        className={`w-4 h-4 transition-opacity opacity-0 ${selectedIndex === index ? "opacity-100" : ""}`}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-base-200 border-t text-xs text-base-content/70">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <kbd className="kbd kbd-sm">↑↓</kbd>
              <span className="h-5">navegar</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="kbd kbd-sm">Enter</kbd>
              <span className="h-5">selecionar</span>
            </span>
          </div>
          <span className="flex items-center space-x-1">
            <kbd className="kbd kbd-sm">Esc</kbd>
            <span className="h-5">fechar</span>
          </span>
        </div>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}