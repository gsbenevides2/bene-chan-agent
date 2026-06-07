import Elysia, { t } from "elysia";

export const chat = new Elysia().ws("/chat", {
  body: t.String(),
  response: t.String(),
  message: (ws, message) => {
    ws.send(message);
  },
});
