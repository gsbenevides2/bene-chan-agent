import z from "zod";
import { Tool } from "./types";

const parameters = z.object({
  name: z.string().meta({
    description: "Repository name",
  }),
  description: z.string().optional().meta({
    description: "Repository description",
  }),
  visibility: z.enum(["public", "private"]).default("public").meta({
    description: "Repository visibility",
  }),
  push: z.boolean().default(false).meta({
    description: "Push local commits to the new repository",
  }),
});

interface Result {
  url: string;
  output: string;
}

export class GhRepoCreate implements Tool<typeof parameters, Result> {
  name = "gh_repo_create";
  description = "Create a new GitHub repository";
  parameters = parameters;

  async run(params: z.infer<typeof parameters>) {
    const { name, description, visibility, push } = params;
    try {
      const args = ["gh", "repo", "create", name, `--${visibility}`];
      if (description) args.push("--description", description);
      if (push) args.push("--push");

      const output = await Bun.$`${args}`.text();
      const urlMatch = output.match(/(https:\/\/github\.com\/\S+)/);
      const url = urlMatch ? urlMatch[1] : "unknown";

      return {
        success: true as const,
        result: { url, output: output.trim() },
      };
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error ? error.message : "Failed to create repository",
      };
    }
  }
}