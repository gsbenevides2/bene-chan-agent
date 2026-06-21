import z from "zod";
import { Tool } from "./types";

const parameters = z.object({
  path: z.string().optional().meta({
    description: "Path to a file or directory to diff (defaults to all changes)",
  }),
  cached: z.boolean().default(false).meta({
    description: "Show staged changes (--cached flag)",
  }),
  stat: z.boolean().default(false).meta({
    description: "Show diffstat instead of full diff",
  }),
  staged: z.boolean().default(false).meta({
    description: "Alias for --cached, shows staged changes",
  }),
});

interface Result {
  output: string;
}

export class GitDiff implements Tool<typeof parameters, Result> {
  name = "git_diff";
  description = "Show changes in the working tree or between commits";
  parameters = parameters;

  async run(params: z.infer<typeof parameters>) {
    const { path: targetPath, cached, stat, staged } = params;
    try {
      const args = ["git", "diff"];
      if (cached || staged) args.push("--cached");
      if (stat) args.push("--stat");
      if (targetPath) args.push("--", targetPath);
      args.push("2>&1");

      const output = await Bun.$`${args}`.text();
      return {
        success: true as const,
        result: { output: output.trim() },
      };
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error ? error.message : "Failed to get diff",
      };
    }
  }
}