import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js'
import { clerkWebhooks } from './controllers/webHooks.js'

// Initialize Express
const app = express()

// connect to database
await connectDB()

// middlexares
app.use(cors())

//routes
app.get('/', (req, res) => res.send('API working fine'))
app.post('/clerk', express.json(), clerkWebhooks)

//port
const PORT = process.env.PORT || 5000

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`)
})