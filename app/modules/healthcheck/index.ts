import Elysia from "elysia";
import { HealthCheckModel } from "./model";

export const healthcheck = new Elysia({ prefix: "/healthcheck" }).get(
  "/",
  () => ({ status: "ok", timestamp: new Date().toISOString() }),
  {
    response: HealthCheckModel.healthcheckResponse,
    detail: {
      summary: "Health Check Endpoint",
      description: "Endpoint to check the health status of the application",
    },
  },
);
