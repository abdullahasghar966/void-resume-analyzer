import app, { allowedOrigins } from "./app.js";

// Dedicated API port — deliberately NOT `PORT`, which dev harnesses/hosts often
// set to the front-end port and would collide with Vite (and break the proxy).
const PORT = Number(process.env.API_PORT ?? 8787);

app.listen(PORT, () => {
  console.log(`[VOID-SERVER] API listening on http://localhost:${PORT}`);
  console.log(`[VOID-SERVER] CORS allow: ${allowedOrigins.join(", ")}`);
});
