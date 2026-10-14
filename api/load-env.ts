/**
 * Explicit env loading for the Vercel serverless runtime.
 *
 * `dotenv.config()` in server.ts resolves `.env` relative to the module's own directory,
 * which under Vercel's build differs from the project root. Load it explicitly here before
 * anything else touches `process.env`, then let server.ts's own call be a no-op.
 */
import path from 'path';
import dotenv from 'dotenv';

const root = path.resolve(__dirname, '..');
for (const f of ['.env.local', '.env']) {
  dotenv.config({ path: path.join(root, f), override: false });
}
