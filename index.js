import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { connectDB } from './db.js'
import { routerTransactions } from './routes/transactions.js'
import { routerCategories } from './routes/categories.js'

const app = express()

connectDB()

app.use(cors())
app.use(bodyParser.json())

app.use('/api/transactions', routerTransactions )
app.use('/api/categories', routerCategories)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log('Server started on port ', PORT)
})
