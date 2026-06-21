import z from "zod";
import { Tool } from "./types";

const parameters = z.object({
  location: z.string().meta({
    description: "Locations while need to write the file",
  }),
  content: z.string().meta({
    description: "File data to write",
  }),
});

interface Result {
  writed: boolean;
}

export class WriteFile implements Tool<typeof parameters, Result> {
  name = "write_file";
  description = "Write a file in disk";
  parameters = parameters;

  async run(params: z.infer<typeof parameters>) {
    try {
      await Bun.file(params.location).write(params.content);
      return {
        success: true as const,
        result: {
          writed: true,
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      return {
        success: true as const,
        result: {
          writed: false,
        },
      };
    }
  }
}
