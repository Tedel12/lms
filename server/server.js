import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js'
import { clerkWebhooks } from './controllers/webHooks.js'
import educatorRouter from './routes/educatorRoutes.js'
import { clerkMiddleware } from '@clerk/express'

const app = express()

// Middlewares
app.use(cors())
app.use(express.json()) // important pour les POST
app.use(clerkMiddleware())

// Routes
app.get('/', (req, res) => res.send('API working fine'))
app.post('/clerk', clerkWebhooks)
app.use('/api/educator', educatorRouter)

// Connexion DB
connectDB()
  .then(() => console.log('MongoDB connecté'))
  .catch((err) => console.error('Erreur MongoDB', err))

export default app