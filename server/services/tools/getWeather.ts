import z from "zod";
import { Tool } from "./types";

const parameters = z.object({
  location: z.string().meta({
    description: "Localidade que se deseja obter",
  }),
});

interface Result {
  location: string;
  temperature: string;
  condition: string;
}

export class GetWeather implements Tool<typeof parameters, Result> {
  name = "get_current_weather";
  description = "Obtem as condições Climáticas de um Local";
  parameters = parameters;

  async run(params: z.infer<typeof parameters>) {
    const { location } = params;
    return {
      success: true as const,
      result: {
        location: location,
        temperature: "22°C",
        condition: "Ensolarado",
      },
    };
  }
}
