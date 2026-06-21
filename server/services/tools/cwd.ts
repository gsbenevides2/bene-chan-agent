import z from "zod";
import fs from "node:fs";
import path from "node:path";
import { Tool } from "./types";

const parameters = z.object({
  setPath: z.string().optional().meta({
    description: "Change the process CWD to this path",
  }),
  list: z.boolean().default(false).meta({
    description: "List directory contents at the current or specified path",
  }),
  listPath: z.string().optional().meta({
    description: "Path to list (defaults to current CWD)",
  }),
});

interface DirEntry {
  name: string;
  type: "file" | "directory";
  path: string;
}

interface Result {
  cwd: string;
  entries?: DirEntry[];
}

export class Cwd implements Tool<typeof parameters, Result> {
  name = "cwd";
  description = "Read or change the current working directory. Use this to set where file listing, git, and gh operations run.";
  parameters = parameters;

  async run(params: z.infer<typeof parameters>) {
    const { setPath, list, listPath } = params;
    try {
      if (setPath) {
        const resolved = path.resolve(setPath);
        if (!fs.existsSync(resolved)) {
          return {
            success: false as const,
            error: `Directory not found: ${resolved}`,
          };
        }
        process.chdir(resolved);
      }

      const currentCwd = process.cwd();
      const result: Result = { cwd: currentCwd };

      const targetPath = listPath ? path.resolve(listPath) : currentCwd;

      if (list) {
        if (!fs.existsSync(targetPath)) {
          return {
            success: false as const,
            error: `Directory not found: ${targetPath}`,
          };
        }
        const entries: DirEntry[] = [];
        const dirEntries = fs.readdirSync(targetPath, { withFileTypes: true });
        for (const entry of dirEntries) {
          entries.push({
            name: entry.name,
            type: entry.isDirectory() ? "directory" : "file",
            path: path.join(targetPath, entry.name),
          });
        }
        result.entries = entries;
      }

      return {
        success: true as const,
        result,
      };
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error ? error.message : "Failed to read/change CWD",
      };
    }
  }
}