import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { supabaseMiddleware } from './middleware/auth.middleware'
import type { HonoEnv } from './types'
import { meRouter, profilesRouter } from './routes/identity'
import { guidesRouter, variantsRouter, revisionsRouter } from './routes/guides'
import { prerequisitesRouter, todosRouter } from './routes/graph'
import { subjectsRouter } from './routes/subjects'
import { reviewsRouter } from './routes/reviews'
import { mediaRouter } from './routes/media'

const app = new Hono<HonoEnv>()
  .use((c, next) => cors({ origin: c.env.APP_URL })(c, next))
  .use(supabaseMiddleware())
  .get('/', (c) => c.json({ ok: true }))

  .route('/me', meRouter)
  .route('/profiles', profilesRouter)
  .route('/guides', guidesRouter)
  .route('/variants', variantsRouter)
  .route('/revisions', revisionsRouter)
  .route('/prerequisites', prerequisitesRouter)
  .route('/todos', todosRouter)
  .route('/subjects', subjectsRouter)
  .route('/reviews', reviewsRouter)
  .route('/media', mediaRouter)

export default app
export type AppType = typeof app
