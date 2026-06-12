import { Hono } from 'hono'
import { requireUser } from '../middleware/auth.middleware'
import type { HonoEnv } from '../types'

export const meRouter = new Hono<HonoEnv>()
  // Own user's row
  .get('/', requireUser, (c) => c.json({ error: 'Not implemented' }, 501))

  // Update the caller's own profile
  .patch('/', requireUser, (c) => c.json({ error: 'Not implemented' }, 501))

export const profilesRouter = new Hono<HonoEnv>()
  // Public profile by username
  .get('/:username', (c) => c.json({ error: 'Not implemented' }, 501))
