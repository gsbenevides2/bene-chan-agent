import z from "zod";
import { Tool } from "./types";

const parameters = z.object({
  message: z.string().meta({
    description: "Commit message",
  }),
  files: z.array(z.string()).optional().meta({
    description: "Specific files to stage (defaults to all changes)",
  }),
  all: z.boolean().default(true).meta({
    description: "Stage all changes before committing",
  }),
});

interface Result {
  commitHash: string;
  output: string;
}

export class GitCommit implements Tool<typeof parameters, Result> {
  name = "git_commit";
  description = "Stage and commit changes to the git repository";
  parameters = parameters;

  async run(params: z.infer<typeof parameters>) {
    const { message, files, all } = params;
    try {
      if (files && files.length > 0) {
        const addCmd = ["git", "add", ...files];
        await Bun.$`${addCmd}`;
      } else if (all) {
        await Bun.$`git add -A`;
      }

      const output = await Bun.$`git commit -m ${message}`.text();
      const hashMatch = output.match(/\[[\w-]+ ([a-f0-9]+)\]/);
      const commitHash = hashMatch ? hashMatch[1] : "unknown";

      return {
        success: true as const,
        result: { commitHash, output: output.trim() },
      };
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error ? error.message : "Failed to commit",
      };
    }
  }
}