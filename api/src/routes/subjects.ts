import { Hono } from 'hono'
import { requireUser } from '../middleware/auth.middleware'
import type { HonoEnv } from '../types'

export const subjectsRouter = new Hono<HonoEnv>()
  // List all subjects
  .get('/', (c) => c.json({ error: 'Not implemented' }, 501))

  // Create a subject
  .post('/', requireUser, (c) => c.json({ error: 'Not implemented' }, 501))

  // Subject metadata only (the tagged list is a separate call)
  .get('/:slug', (c) => c.json({ error: 'Not implemented' }, 501))

  // Alphabetical list of topics carrying this subject tag
  .get('/:slug/guides', (c) => c.json({ error: 'Not implemented' }, 501))
