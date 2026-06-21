import z from "zod";
import { Tool } from "./types";

const parameters = z.object({
  branchName: z.string().meta({
    description: "Name of the new branch to create",
  }),
  baseBranch: z.string().optional().meta({
    description: "Base branch to branch from (defaults to current branch)",
  }),
  method: z.enum(["checkout", "switch"]).default("checkout").meta({
    description: "Git command to use: checkout -b or switch -c",
  }),
});

interface Result {
  branch: string;
  command: string;
  output: string;
}

export class GitCreateBranch implements Tool<typeof parameters, Result> {
  name = "git_create_branch";
  description = "Create a new git branch and switch to it";
  parameters = parameters;

  async run(params: z.infer<typeof parameters>) {
    const { branchName, baseBranch, method } = params;
    try {
      const flag = method === "switch" ? "-c" : "-b";
      const cmd = baseBranch
        ? `git ${method} ${flag} ${branchName} ${baseBranch}`
        : `git ${method} ${flag} ${branchName}`;

      const output = await Bun.$`${cmd.split(" ")}`.text();
      return {
        success: true as const,
        result: { branch: branchName, command: cmd, output: output.trim() },
      };
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error ? error.message : "Failed to create branch",
      };
    }
  }
}