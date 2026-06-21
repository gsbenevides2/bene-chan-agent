import z from "zod";
import { Tool } from "./types";

const parameters = z.object({
  location: z.string().meta({
    description: "Absolute path of the file to delete",
  }),
});

interface Result {
  deleted: boolean;
}

export class DeleteFile implements Tool<typeof parameters, Result> {
  name = "delete_file";
  description = "Delete a file from disk";
  parameters = parameters;

  async run(params: z.infer<typeof parameters>) {
    try {
      const file = Bun.file(params.location);
      const exists = await file.exists();
      if (!exists) {
        return {
          success: false as const,
          error: `File not found at ${params.location}`,
        };
      }
      await Bun.$`rm ${params.location}`;
      return {
        success: true as const,
        result: { deleted: true },
      };
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error ? error.message : "Failed to delete file",
      };
    }
  }
}