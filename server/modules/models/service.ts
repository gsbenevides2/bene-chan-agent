import { OpenRouterService } from "@/server/services/openrouter";

export type ModelEntry = {
  id: string;
  name: string;
  provider: string;
  description?: string;
};

export class ModelService {
  static cache: { data: ModelEntry[]; timestamp: number } | null = null;
  static CACHE_TTL = 5 * 60 * 1000;

  static async listModels(): Promise<ModelEntry[]> {
    if (
      this.cache &&
      Date.now() - this.cache.timestamp < this.CACHE_TTL
    ) {
      return this.cache.data;
    }

    const response = await OpenRouterService.openRouter.models.list();

    const models = response.data.map((model) => ({
      id: model.id,
      name: model.name,
      provider: model.id.split("/")[0] ?? "",
      description: model.description,
    }));

    const providerOrder = ["openai", "anthropic", "google", "meta", "mistral"];

    models.sort((a, b) => {
      const aProvider = a.id.split("/")[0];
      const bProvider = b.id.split("/")[0];
      const aIdx = providerOrder.indexOf(aProvider);
      const bIdx = providerOrder.indexOf(bProvider);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.id.localeCompare(b.id);
    });

    this.cache = { data: models, timestamp: Date.now() };

    return models;
  }
}
