import z from "zod";
import { Tool } from "./types";

const parameters = z.object({
  path: z.string().meta({
    description: "Absolute path of the directory to create",
  }),
  recursive: z.boolean().default(true).meta({
    description: "Create parent directories if they don't exist",
  }),
});

interface Result {
  created: boolean;
}

export class Mkdir implements Tool<typeof parameters, Result> {
  name = "mkdir";
  description = "Create a directory (folder) at the specified path";
  parameters = parameters;

  async run(params: z.infer<typeof parameters>) {
    try {
      await Bun.$`mkdir -p ${params.path}`;
      return {
        success: true as const,
        result: { created: true },
      };
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error ? error.message : "Failed to create directory",
      };
    }
  }
}