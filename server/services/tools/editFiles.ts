import z from "zod";
import { Tool } from "./types";

const editOperationSchema = z.object({
  location: z.string().meta({ description: "Absolute path to the file to edit" }),
  oldString: z.string().meta({ description: "The exact text to find and replace" }),
  newString: z.string().meta({ description: "The replacement text" }),
});

const parameters = z.object({
  operations: z.array(editOperationSchema).min(1).meta({
    description: "List of find-and-replace operations across multiple files",
  }),
});

interface EditResult {
  location: string;
  edited: boolean;
  error?: string;
}

interface Result {
  results: EditResult[];
}

export class EditFiles implements Tool<typeof parameters, Result> {
  name = "edit_files";
  description = "Edit multiple files at once by applying a list of find-and-replace operations";
  parameters = parameters;

  async run(params: z.infer<typeof parameters>) {
    const results: EditResult[] = [];

    for (const op of params.operations) {
      try {
        const file = Bun.file(op.location);
        const content = await file.text();

        if (!content.includes(op.oldString)) {
          results.push({
            location: op.location,
            edited: false,
            error: "oldString not found in file",
          });
          continue;
        }

        const newContent = content.replace(op.oldString, op.newString);
        if (newContent === content) {
          results.push({
            location: op.location,
            edited: false,
            error: "No changes were made",
          });
          continue;
        }

        await Bun.write(file, newContent);
        results.push({ location: op.location, edited: true });
      } catch (error) {
        results.push({
          location: op.location,
          edited: false,
          error: error instanceof Error ? error.message : "Failed to edit file",
        });
      }
    }

    const allEdited = results.every((r) => r.edited);
    if (!allEdited) {
      const failed = results.filter((r) => !r.edited);
      return {
        success: false as const,
        error: `Some files failed to edit: ${failed.map((f) => `${f.location} (${f.error})`).join(", ")}`,
      };
    }

    return {
      success: true as const,
      result: { results },
    };
  }
}