import z from "zod";
import { Tool } from "./types";

const parameters = z.object({
  path: z.string().optional().meta({
    description: "Path where to initialize the git repository (defaults to current directory)",
  }),
  initialBranch: z.string().optional().meta({
    description: "Initial branch name (e.g. main)",
  }),
  bare: z.boolean().default(false).meta({
    description: "Create a bare repository",
  }),
});

interface Result {
  output: string;
  path: string;
}

export class GitInit implements Tool<typeof parameters, Result> {
  name = "git_init";
  description = "Initialize a new git repository";
  parameters = parameters;

  async run(params: z.infer<typeof parameters>) {
    const { path: targetPath, initialBranch, bare } = params;
    try {
      const args = ["git", "init"];
      if (bare) args.push("--bare");
      if (targetPath) args.push(targetPath);
      if (initialBranch) args.push("--initial-branch", initialBranch);

      args.push("2>&1");
      const output = await Bun.$`${args}`.text();
      return {
        success: true as const,
        result: {
          output: output.trim(),
          path: targetPath ?? process.cwd(),
        },
      };
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error ? error.message : "Failed to initialize repository",
      };
    }
  }
}