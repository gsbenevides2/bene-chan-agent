import z from "zod";
import { Tool } from "./types";

const parameters = z.object({
  remote: z.string().default("origin").meta({
    description: "Remote name to push to",
  }),
  branch: z.string().optional().meta({
    description: "Branch to push (defaults to current branch)",
  }),
  setUpstream: z.boolean().default(false).meta({
    description: "Set upstream tracking (-u flag)",
  }),
});

interface Result {
  output: string;
}

export class GitPush implements Tool<typeof parameters, Result> {
  name = "git_push";
  description = "Push commits to a remote repository";
  parameters = parameters;

  async run(params: z.infer<typeof parameters>) {
    const { remote, branch, setUpstream } = params;
    try {
      const args = ["git", "push"];
      if (setUpstream) args.push("-u");
      if (branch) {
        args.push(remote, branch);
      }
      args.push("2>&1");

      const output = await Bun.$`${args}`.text();
      return {
        success: true as const,
        result: { output: output.trim() },
      };
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error ? error.message : "Failed to push",
      };
    }
  }
}