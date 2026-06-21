import z from "zod";
import { Tool } from "./types";

const fileOperationSchema = z.object({
  location: z.string().meta({ description: "Absolute path of the file to write" }),
  content: z.string().meta({ description: "File data to write" }),
});

const parameters = z.object({
  files: z.array(fileOperationSchema).min(1).meta({
    description: "List of files to write",
  }),
});

interface FileResult {
  location: string;
  writed: boolean;
  error?: string;
}

interface Result {
  results: FileResult[];
}

export class WriteFiles implements Tool<typeof parameters, Result> {
  name = "write_files";
  description = "Write multiple files to disk at once";
  parameters = parameters;

  async run(params: z.infer<typeof parameters>) {
    const results: FileResult[] = await Promise.all(
      params.files.map(async (file) => {
        try {
          await Bun.file(file.location).write(file.content);
          return { location: file.location, writed: true };
        } catch (error) {
          return {
            location: file.location,
            writed: false,
            error: error instanceof Error ? error.message : "Failed to write file",
          };
        }
      }),
    );

    const failed = results.filter((r) => !r.writed);
    if (failed.length > 0) {
      return {
        success: false as const,
        error: `Some files failed: ${failed.map((f) => `${f.location} (${f.error})`).join(", ")}`,
      };
    }

    return {
      success: true as const,
      result: { results },
    };
  }
}