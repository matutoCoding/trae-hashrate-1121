/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { initDatabase } from './db/index.js'
import { seedDatabase } from './db/seed.js'
import queueRoutes from './routes/queue.js'
import quotaRoutes from './routes/quota.js'
import cutRoutes from './routes/cut.js'
import consumptionRoutes from './routes/consumption.js'
import stallRoutes from './routes/stall.js'
import userRoutes from './routes/user.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * Database Initialization
 */
initDatabase();
seedDatabase();

/**
 * API Routes
 */
app.use('/api/queue', queueRoutes);
app.use('/api/quota', quotaRoutes);
app.use('/api/cut', cutRoutes);
app.use('/api/consumption', consumptionRoutes);
app.use('/api/stall', stallRoutes);
app.use('/api/user', userRoutes);

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
