import z from "zod";
import { Tool } from "./types";

const parameters = z.object({
  prNumber: z.number().optional().meta({
    description: "PR number (defaults to PR for current branch)",
  }),
  comments: z.boolean().default(false).meta({
    description: "View PR comments (--comments flag)",
  }),
  json: z.boolean().default(false).meta({
    description: "View PR as JSON (--json flag)",
  }),
  jsonFields: z.array(z.string()).optional().meta({
    description: "JSON fields to include (e.g. number,title,body,comments,reviews)",
  }),
});

interface Result {
  output: string;
}

export class GhPrView implements Tool<typeof parameters, Result> {
  name = "gh_pr_view";
  description = "View a GitHub pull request (supports --comments and --json variants)";
  parameters = parameters;

  async run(params: z.infer<typeof parameters>) {
    const { prNumber, comments, json, jsonFields } = params;
    try {
      const args = ["gh", "pr", "view"];
      if (prNumber) args.push(String(prNumber));
      if (comments) args.push("--comments");
      if (json) {
        args.push("--json");
        if (jsonFields && jsonFields.length > 0) {
          args.push(jsonFields.join(","));
        } else {
          args.push("number,title,body,state,author,headRefName,baseRefName,createdAt,mergedAt,comments,reviews,labels,assignees");
        }
      }

      const output = await Bun.$`${args}`.text();
      return {
        success: true as const,
        result: { output: output.trim() },
      };
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error ? error.message : "Failed to view PR",
      };
    }
  }
}