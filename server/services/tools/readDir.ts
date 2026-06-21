import z from "zod";
import fs from "node:fs";
import { Tool } from "./types";

const parameters = z.object({
  path: z.string().meta({
    description: "Absolute path of the directory to list",
  }),
  recursive: z.boolean().default(false).meta({
    description: "List contents recursively",
  }),
});

interface DirEntry {
  name: string;
  type: "file" | "directory";
  path: string;
}

interface Result {
  entries: DirEntry[];
}

export class ReadDir implements Tool<typeof parameters, Result> {
  name = "read_dir";
  description = "List the contents of a directory";
  parameters = parameters;

  async run(params: z.infer<typeof parameters>) {
    try {
      if (!fs.existsSync(params.path)) {
        return {
          success: false as const,
          error: `Directory not found at ${params.path}`,
        };
      }

      const entries: DirEntry[] = [];

      if (params.recursive) {
        const walkDir = (dir: string, baseDir: string) => {
          const dirEntries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of dirEntries) {
            const fullPath = `${dir}/${entry.name}`;
            const relativeName = fullPath.replace(`${baseDir}/`, "");
            entries.push({
              name: relativeName,
              type: entry.isDirectory() ? "directory" : "file",
              path: fullPath,
            });
            if (entry.isDirectory()) {
              walkDir(fullPath, baseDir);
            }
          }
        };
        walkDir(params.path, params.path);
      } else {
        const dirEntries = fs.readdirSync(params.path, { withFileTypes: true });
        for (const entry of dirEntries) {
          const fullPath = `${params.path}/${entry.name}`;
          entries.push({
            name: entry.name,
            type: entry.isDirectory() ? "directory" : "file",
            path: fullPath,
          });
        }
      }

      return {
        success: true as const,
        result: { entries },
      };
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error ? error.message : "Failed to read directory",
      };
    }
  }
}