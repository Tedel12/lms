import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js'
import { clerkWebhooks } from './controllers/webHooks.js'

const app = express()

// Middleware
app.use(cors())
app.use(express.json()) // important pour les POST

// Routes
app.get('/', (req, res) => res.send('API working fine'))
app.post('/clerk', clerkWebhooks)

// Connexion DB
connectDB()
  .then(() => console.log('MongoDB connecté'))
  .catch((err) => console.error('Erreur MongoDB', err))

export default app