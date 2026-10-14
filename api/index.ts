/**
 * Vercel serverless entrypoint for the Krostio API.
 *
 * On Railway/Docker the app runs from `server.ts` as a long-lived process, where the
 * transactional-outbox worker and expiry sweeper run as in-process `setInterval` timers.
 * Vercel functions are stateless and short-lived, so those timers are exposed here as
 * plain HTTP endpoints and driven by Vercel Cron Jobs (see `vercel.json`).
 *
 * The Express app itself is imported from the same `buildApiApp()` factory the
 * long-lived server uses, so route behaviour is identical in both deployments.
 */
import './load-env';
import { buildApiApp, runOutboxWorker, runExpirySweeper, verifyCronSecret } from '../server';

const app = buildApiApp();

export default async function handler(req: any, res: any) {
  // Cron-style background work endpoints (invoked by Vercel Cron with a bearer secret).
  const url: string = req.url || '';

  if (url.startsWith('/_cron/outbox')) {
    if (!verifyCronSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
    const result = await runOutboxWorker();
    return res.status(200).json(result);
  }

  if (url.startsWith('/_cron/expiry-sweeper')) {
    if (!verifyCronSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
    const swept = runExpirySweeper();
    return res.status(200).json({ swept });
  }

  return app(req, res);
}
