// Vercel serverless entry: every /api/* request is rewritten here (vercel.json)
// and handled by the same Express app the local dev server uses.
import app from "../server/app.js";

export default app;
