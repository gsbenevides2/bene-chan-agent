import { registerOTel } from "@vercel/otel";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";

export function register() {
  registerOTel({
    serviceName: "bene-chan",
    instrumentations: [
      new HttpInstrumentation({
        headersToSpanAttributes: {
          client: {
            requestHeaders: ["content-type", "authorization"],
            responseHeaders: ["content-type", "x-request-id"],
          },
        },
      }),
    ],
    attributes: {
      "deployment.environment": Bun.env.NODE_ENV ?? "development",
    },
  });
}