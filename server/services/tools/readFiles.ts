import z from "zod";
import { Tool } from "./types";

const parameters = z.object({
  paths: z.array(z.string()).min(1).meta({
    description: "Array of absolute file paths to read",
  }),
});

interface FileContent {
  path: string;
  content: string;
  error?: string;
}

interface Result {
  files: FileContent[];
}

export class ReadFiles implements Tool<typeof parameters, Result> {
  name = "read_files";
  description = "Read multiple files simultaneously and return their contents";
  parameters = parameters;

  async run(params: z.infer<typeof parameters>) {
    const results: FileContent[] = await Promise.all(
      params.paths.map(async (path) => {
        try {
          const file = Bun.file(path);
          const content = await file.text();
          return { path, content };
        } catch (error) {
          return {
            path,
            content: "",
            error: error instanceof Error ? error.message : "Failed to read file",
          };
        }
      }),
    );

    const failed = results.filter((r) => r.error);
    if (failed.length > 0) {
      return {
        success: false as const,
        error: `Failed to read: ${failed.map((f) => `${f.path} (${f.error})`).join(", ")}`,
      };
    }

    return {
      success: true as const,
      result: { files: results.map(({ path, content }) => ({ path, content })) },
    };
  }
}