import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { connectDB } from './db.js'
import { routerAuth } from './routes/auth.js'
import { routerTransactions } from './routes/transactions.js'
import { routerCategories } from './routes/categories.js'

const app = express()

connectDB()

app.use(
  cors({
    origin: [
      'http://localhost:5173', // dev
      'https://budget-treker.vercel.app', // prod
    ],
    credentials: true, // если используешь cookies
  })
)
app.use(bodyParser.json())

app.use('/api/auth', routerAuth)
app.use('/api/transactions', routerTransactions)
app.use('/api/categories', routerCategories)

// Проверка здоровья
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

// Middleware для перенаправления всех необработанных маршрутов на корневой маршрут
app.use((req, res) => {
  res.redirect('/')
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log('Server started on port ', PORT)
})
