import { Elysia } from "elysia";
import { openapi } from "@elysia/openapi";
import { healthcheck } from "@/server/modules/healthcheck";
import { getProjectInfo } from "@/server/utils/getProjectInfo";
import { chat } from "@/server/modules/chat";
import cors from "@elysia/cors";

export const dynamic = "force-dynamic";

const app = new Elysia({ prefix: "/api" })
  .use(
    openapi({
      documentation: {
        info: getProjectInfo(),
      },
    }),
  )
  .use(
    cors({
      origin: true,
      credentials: true,
    }),
  )
  .use(healthcheck)
  .use(chat);

export type App = typeof app;
export const GET = app.handle;
export const POST = app.handle;
export const PUT = app.handle;
export const DELETE = app.handle;
export const PATCH = app.handle;
export const UPGRADE = app.handle;
export const HEAD = app.handle;
export const OPTIONS = app.handle;
