import { t, type UnwrapSchema } from "elysia";

export const HealthCheckModel = {
  healthcheckResponse: t.Object(
    {
      status: t.Const("ok", {
        title: "Status",
        description: "Status of the health check",
      }),
      timestamp: t.String({
        title: "Timestamp",
        description:
          "ISO 8601 formatted timestamp of the health check response",
        exemple: new Date().toISOString(),
      }),
    },
    {
      title: "HealthCheckResponse",
      description: "Response schema for the health check endpoint",
      exemple: {
        status: "ok",
        timestamp: new Date().toISOString(),
      },
    },
  ),
} as const;

export type HealthCheckModel = {
  [k in keyof typeof HealthCheckModel]: UnwrapSchema<
    (typeof HealthCheckModel)[k]
  >;
};
