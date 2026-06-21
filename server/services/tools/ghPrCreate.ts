import z from "zod";
import { Tool } from "./types";

const parameters = z.object({
  title: z.string().meta({
    description: "Pull request title",
  }),
  body: z.string().optional().meta({
    description: "Pull request body/description",
  }),
  base: z.string().optional().meta({
    description: "Base branch (defaults to repository default branch)",
  }),
  head: z.string().optional().meta({
    description: "Head branch (defaults to current branch)",
  }),
  draft: z.boolean().default(false).meta({
    description: "Create as draft pull request",
  }),
});

interface Result {
  url: string;
  number: number;
  output: string;
}

export class GhPrCreate implements Tool<typeof parameters, Result> {
  name = "gh_pr_create";
  description = "Create a GitHub pull request";
  parameters = parameters;

  async run(params: z.infer<typeof parameters>) {
    const { title, body, base, head, draft } = params;
    try {
      const args = ["gh", "pr", "create", "--title", title];
      if (body) args.push("--body", body);
      if (base) args.push("--base", base);
      if (head) args.push("--head", head);
      if (draft) args.push("--draft");

      const output = await Bun.$`${args}`.text();
      const trimmed = output.trim();

      const numberMatch = trimmed.match(/#(\d+)/);
      const number = numberMatch ? parseInt(numberMatch[1]) : 0;

      return {
        success: true as const,
        result: { url: trimmed, number, output: trimmed },
      };
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error ? error.message : "Failed to create PR",
      };
    }
  }
}