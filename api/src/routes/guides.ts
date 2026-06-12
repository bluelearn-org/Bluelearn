import { Hono } from 'hono'
import { requireUser } from '../middleware/auth.middleware'
import type { HonoEnv } from '../types'

export const guidesRouter = new Hono<HonoEnv>()
  // List all guides
  .get('/', (c) => c.json({ error: 'Not implemented' }, 501))

  // Create a topic: bundles the guide_base + first variant + draft revision
  .post('/', requireUser, (c) => c.json({ error: 'Not implemented' }, 501))

  // Resolves to the current canonical variant + inline neighborhood
  .get('/:slug', (c) => c.json({ error: 'Not implemented' }, 501))

  // Archive the topic
  .delete('/:slug', requireUser, (c) => c.json({ error: 'Not implemented' }, 501))

  // Materialize the transitive prerequisite DAG
  .get('/:slug/walkthrough', (c) => c.json({ error: 'Not implemented' }, 501))

  // Declare a TODO prerequisite
  .post('/:slug/todos', requireUser, (c) => c.json({ error: 'Not implemented' }, 501))

  // Variants under this topic
  .get('/:slug/variants', (c) => c.json({ error: 'Not implemented' }, 501))

  // Add a new variant under this topic
  .post('/:slug/variants', requireUser, (c) => c.json({ error: 'Not implemented' }, 501))

export const variantsRouter = new Hono<HonoEnv>()
  // Shows variant details: current revision content + vote tally
  .get('/:id', (c) => c.json({ error: 'Not implemented' }, 501))

  // Archive the variant
  .delete('/:id', requireUser, (c) => c.json({ error: 'Not implemented' }, 501))

  // Cast or update a vote
  .put('/:id/vote', requireUser, (c) => c.json({ error: 'Not implemented' }, 501))

  // Retract the caller's vote on this variant
  .delete('/:id/vote', requireUser, (c) => c.json({ error: 'Not implemented' }, 501))

  // Revision history for this variant
  .get('/:id/revisions', (c) => c.json({ error: 'Not implemented' }, 501))

  // Start a new draft revision
  .post('/:id/revisions', requireUser, (c) => c.json({ error: 'Not implemented' }, 501))

  // Roll back: insert a new revision copying an older snapshot
  .post('/:id/rollback', requireUser, (c) => c.json({ error: 'Not implemented' }, 501))

export const revisionsRouter = new Hono<HonoEnv>()
  // A single revision snapshot (content + status)
  .get('/:id', (c) => c.json({ error: 'Not implemented' }, 501))

  // Overwrite a draft revision (pre-submit only)
  .patch('/:id', requireUser, (c) => c.json({ error: 'Not implemented' }, 501))

  // Submit for review: flips to submitted and opens a review_case (same transaction)
  .post('/:id/submit', requireUser, (c) => c.json({ error: 'Not implemented' }, 501))

  // Rendered diff between two snapshots
  .get('/:id/diff/:otherId', (c) => c.json({ error: 'Not implemented' }, 501))
