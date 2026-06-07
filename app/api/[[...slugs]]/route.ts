import { Elysia } from "elysia";
import { openapi } from "@elysia/openapi";
import { healthcheck } from "@/src/modules/healthcheck";
import { getProjectInfo } from "@/src/utils/getProjectInfo";
import { chat } from "@/src/modules/chat";

const app = new Elysia({ prefix: "/api" })
  .use(
    openapi({
      documentation: {
        info: getProjectInfo(),
      },
    }),
  )
  .use(healthcheck)
  .use(chat);

export const GET = app.fetch;
export const POST = app.fetch;
export const PUT = app.fetch;
export const DELETE = app.fetch;
export const PATCH = app.fetch;
