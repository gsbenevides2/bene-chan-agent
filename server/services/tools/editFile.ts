import z from "zod";
import { Tool } from "./types";

const parameters = z.object({
  location: z.string().meta({
    description: "Absolute path to the file to edit",
  }),
  oldString: z.string().meta({
    description: "The exact text to find and replace",
  }),
  newString: z.string().meta({
    description: "The replacement text",
  }),
});

interface Result {
  edited: boolean;
}

export class EditFile implements Tool<typeof parameters, Result> {
  name = "edit_file";
  description = "Edit parts of a file by replacing specific text (find & replace). Supports inserting new content and removing lines.";
  parameters = parameters;

  async run(params: z.infer<typeof parameters>) {
    try {
      const file = Bun.file(params.location);
      const content = await file.text();
      if (!content.includes(params.oldString)) {
        return {
          success: false as const,
          error: `oldString not found in file at ${params.location}`,
        };
      }
      const newContent = content.replace(params.oldString, params.newString);
      if (newContent === content) {
        return {
          success: false as const,
          error: "No changes were made",
        };
      }
      await Bun.write(file, newContent);
      return {
        success: true as const,
        result: { edited: true },
      };
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error ? error.message : "Failed to edit file",
      };
    }
  }
}