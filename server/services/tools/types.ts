import z from "zod";

type Parameters = z.ZodObject | z.ZodUndefined;
export type Result<R> =
  | {
      success: true;
      result: R;
    }
  | {
      success: false;
      error: string;
    };

export abstract class Tool<T extends Parameters, R> {
  abstract name: string;
  abstract description: string;
  abstract parameters: T;

  abstract run(params: z.infer<T>): Promise<Result<R>>;
}
