import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js'
import { clerkWebhooks } from './controllers/webHooks.js'
import educatorRouter from './routes/educatorRoutes.js'
import { clerkMiddleware } from '@clerk/express'
import connectCloudianry from './configs/cloudinary.js'
import courseRouter from './routes/courseRoute.js'
import userRouter from './routes/userRoutes.js'
import router from './routes/quizRoutes.js'
import Certificaterouter from './routes/certificateRoutes.js'
import path from 'path'

const app = express()

// Middlewares
app.use(cors())
app.use(express.json()) // important pour les POST

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(clerkMiddleware())

// Routes
app.get('/', (req, res) => res.send('API working fine'))
app.post('/clerk', clerkWebhooks)
app.use('/api/educator', educatorRouter)
app.use('/api/course', courseRouter)
app.use('/api/user', userRouter)
app.use('/api/quiz', router)
app.use('/api/certificate', Certificaterouter)


// Connexion DB
connectDB()
  .then(() => console.log('MongoDB connecté'))
  .catch((err) => console.error('Erreur MongoDB', err))



connectCloudianry()

export default app