import { Hono } from 'hono'
import { requireUser } from '../middleware/auth.middleware'
import type { HonoEnv } from '../types'

export const reviewsRouter = new Hono<HonoEnv>()
  // Open cases needing action (caller's pool / assigned seats)
  .get('/queue', requireUser, (c) => c.json({ error: 'Not implemented' }, 501))

  // All / past cases
  .get('/cases', (c) => c.json({ error: 'Not implemented' }, 501))

  // Case + panel + decisions
  .get('/cases/:id', (c) => c.json({ error: 'Not implemented' }, 501))

  // Cast a panel vote + written justification (+ rubric reasons if rejected)
  .post('/cases/:id/decisions', requireUser, (c) => c.json({ error: 'Not implemented' }, 501))
