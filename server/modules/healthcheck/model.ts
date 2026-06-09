import z from "zod";

export const HealthCheckModel = {
  healthcheckResponse: z.object({
    status: z.literal("ok").meta({
      title: "Status",
      description: "Health status of the application",
      example: "ok",
    }),
    timestamp: z.iso.datetime().meta({
      title: "Timestamp",
      description: "ISO timestamp of when the health check was performed",
      example: "2024-06-01T12:00:00.000Z",
    }),
  }),
} as const;

export type HealthCheckModel = z.infer<typeof HealthCheckModel>;
