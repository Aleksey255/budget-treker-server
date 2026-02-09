import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { connectDB } from './db.js'
import { routerAuth } from './routes/auth.js'
import { routerTransactions } from './routes/transactions.js'
import { routerCategories } from './routes/categories.js'

// 🔁 Получаем __dirname в ES-модулях
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()

connectDB()

app.use(cors())
app.use(bodyParser.json())

app.use('/api/auth', routerAuth)
app.use('/api/transactions', routerTransactions)
app.use('/api/categories', routerCategories)

// Проверка здоровья
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

// ✅ Обслуживание статики (если фронтенд собран в client/dist)
const distPath = join(__dirname, '../client/dist')

app.use(express.static(distPath))

// ✅ Все остальные маршруты — отдаём index.html (для SPA)

app.get(/^(?!\/api).*/i, (req, res) => {
  res.sendFile(join(distPath, 'index.html'))
})
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log('Server started on port ', PORT)
})
