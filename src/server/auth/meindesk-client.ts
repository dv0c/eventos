import { createMeindeskClient } from "@meindesk/nextjs/server";
import type { MeindeskClient } from "@meindesk/sdk";

import { getMeindeskAppOrigin } from "./meindesk-origin";

export { getMeindeskAppOrigin, resolveMeindeskOrigin } from "./meindesk-origin";

/**
 * Server Meindesk client that sends Origin so publishable-key origin checks pass.
 * Browser SDK traffic already has Origin; Node fetch does not.
 */
export function createServerMeindeskClient(origin?: string): MeindeskClient {
  const client = createMeindeskClient();
  const resolvedOrigin = (origin ?? getMeindeskAppOrigin()).replace(/\/$/, "");
  const mutable = client as unknown as {
    buildHeaders: (sessionToken?: string) => Record<string, string>;
  };
  const buildHeaders = mutable.buildHeaders.bind(client);

  mutable.buildHeaders = (sessionToken?: string) => {
    const headers = buildHeaders(sessionToken);
    headers.Origin = resolvedOrigin;
    return headers;
  };

  return client;
}
