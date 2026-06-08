import { treaty } from "@elysia/eden";
import type { App } from "@/app/api/[[...slugs]]/route";

export function getApiClient() {
  const url = new URL("", window.location.origin);
  const t = treaty<App>(url.toString());
  return t.api;
}
