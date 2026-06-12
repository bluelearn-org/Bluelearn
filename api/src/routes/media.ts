import { Hono } from 'hono'
import { requireUser } from '../middleware/auth.middleware'
import type { HonoEnv } from '../types'

export const mediaRouter = new Hono<HonoEnv>()
  // Upload a file to object storage
  .post('/upload', requireUser, (c) => c.json({ error: 'Not implemented' }, 501))
