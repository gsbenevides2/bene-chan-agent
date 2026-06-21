import z from "zod";
import { Tool } from "./types";
import { Cwd } from "./cwd";

const parameters = z.object({
  prompt: z.string().meta({
    description: "The prompt/message to send to the AI model",
  }),
  model: z.string().optional().meta({
    description:
      "Model to use in the form provider/model (e.g. anthropic/claude-sonnet-4-20250514)",
  }),
  agent: z.string().optional().meta({
    description: "Agent to use for the session",
  }),
  files: z.array(z.string()).optional().meta({
    description: "File(s) to attach to the message",
  }),
  format: z.enum(["default", "json"]).default("default").meta({
    description: "Output format: default (formatted) or json (raw JSON events)",
  }),
  session: z.string().optional().meta({
    description: "Session ID to continue",
  }),
  fork: z.boolean().default(false).meta({
    description: "Fork the session when continuing",
  }),
  share: z.boolean().default(false).meta({
    description: "Share the session",
  }),
  thinking: z.boolean().default(false).meta({
    description: "Show thinking blocks",
  }),
  title: z.string().optional().meta({
    description:
      "Title for the session (uses truncated prompt if not provided)",
  }),
  dir: z.string().optional().meta({
    description: "Directory to run in",
  }),
  attach: z.string().optional().meta({
    description:
      "Attach to a running opencode server (e.g. http://localhost:4096)",
  }),
  dangerouslySkipPermissions: z.boolean().default(false).meta({
    description: "Auto-approve permissions that are not explicitly denied",
  }),
});

interface Result {
  output: string;
}

export class OpencodeCli implements Tool<typeof parameters, Result> {
  name = "opencode_cli";
  description =
    "Send prompts to an AI model using opencode run. Use this to ask coding questions, refactor code, generate tests, or automate development tasks with an AI model.";
  parameters = parameters;

  async run(params: z.infer<typeof parameters>) {
    const {
      prompt,
      model,
      agent,
      files,
      format,
      session,
      fork,
      share,
      thinking,
      title,
      dir,
      attach,
      dangerouslySkipPermissions,
    } = params;
    try {
      const args = [prompt];
      if (model) args.push("--model", model);
      if (agent) args.push("--agent", agent);
      if (files) for (const f of files) args.push("--file", f);
      if (format === "json") args.push("--format", "json");
      if (session) args.push("--session", session);
      if (fork) args.push("--fork");
      if (share) args.push("--share");
      if (thinking) args.push("--thinking");
      if (title) args.push("--title", title);
      args.push("--dir", dir ?? process.cwd());
      if (attach) args.push("--attach", attach);
      if (dangerouslySkipPermissions)
        args.push("--dangerously-skip-permissions");
      
      const proc = Bun.spawnSync(["opencode", "run", ...args]);

      const stdout = proc.stdout.toString();
      const stderr = proc.stderr.toString();

      if (!proc.exitCode || proc.exitCode === 0) {
        return {
          success: true as const,
          result: { output: stdout.trim() },
        };
      }

      return {
        success: false as const,
        error: stderr.trim() || stdout.trim() || "opencode run failed",
      };
    } catch (error) {
      return {
        success: false as const,
        error:
          error instanceof Error ? error.message : "Failed to run opencode",
      };
    }
  }
}
