import z from "zod";
import { Tool } from "./types";

const parameters = z.object({
  command: z.string().meta({
    description: "The terminal command to execute",
  }),
  cwd: z.string().optional().meta({
    description: "Working directory for the command (defaults to process CWD)",
  }),
});

interface Result {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class Terminal implements Tool<typeof parameters, Result> {
  name = "terminal";
  description = "Execute arbitrary terminal commands. Use this for operations not covered by other tools.";
  parameters = parameters;

  async run(params: z.infer<typeof parameters>) {
    const { command, cwd } = params;
    try {
      const cmd = [`${command} 2>/tmp/opencode-stderr.txt; echo "EXIT_CODE=$?"`];
      const previousCwd = process.cwd();
      if (cwd) process.chdir(cwd);

      const { stdout } = Bun.spawnSync(["bash", "-c", ...cmd]);

      const stderrFile = Bun.file("/tmp/opencode-stderr.txt");
      const stderr = await stderrFile.text();

      if (cwd) process.chdir(previousCwd);

      const lines = stdout.toString().split("\n");
      const exitLine = lines.pop() || "";
      const exitCode = parseInt(exitLine.replace("EXIT_CODE=", ""), 10);
      const output = lines.join("\n");

      return {
        success: true as const,
        result: {
          stdout: output.trim(),
          stderr: stderr.trim(),
          exitCode,
        },
      };
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error ? error.message : "Failed to execute command",
      };
    }
  }
}