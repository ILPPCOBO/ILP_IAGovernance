/**
 * Server entrypoint. Builds the Express app and starts listening.
 * Default port 8830 (override with PORT).
 */

import { createApp } from "./app";

const app = createApp();
const port = Number(process.env.PORT) || 8830;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`AI Governance Policy Builder server listening on http://localhost:${port}`);
});
