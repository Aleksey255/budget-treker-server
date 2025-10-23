import express from 'express'
import  Transaction  from '../models/Transaction.js'

export const routerTransactions = express.Router()

routerTransactions.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 })
    res.json(transactions)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

routerTransactions.post('/', async (req, res) => {
  const transaction = new Transaction({
    type: req.body.type,
    amount: req.body.amount,
    category: req.body.category,
    description: req.body.description,
    date: req.body.date || Date.now(),
  })

  try {
    const newTransaction = await transaction.save()
    res.status(201).json(newTransaction)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

routerTransactions.put('/:id', getTransaction, async (req, res) => {
  if (req.body.type != null) {
    res.transaction.type = req.body.type
  }
  if (req.body.amount != null) {
    res.transaction.amount = req.body.amount
  }
  if (req.body.category != null) {
    res.transaction.category = req.body.category
  }
  if (req.body.description != null) {
    res.transaction.description = req.body.description
  }
  if (req.body.date != null) {
    res.transaction.date = req.body.date
  }

  try {
    const updatedTransaction = await res.transaction.save()
    res.json(updatedTransaction)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

routerTransactions.delete('/:id', getTransaction, async (req, res) => {
  try {
    await res.transaction.remove()
    res.json({ message: 'Deleted Transaction' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

routerTransactions.get('/reports', async (req, res) => {
  const { startDate, endDate } = req.query
  const start = startDate ? new Date(startDate) : new Date('2000-01-01')
  const end = endDate ? new Date(endDate) : new Date()

  try {
    const incomeAggregation = await Transaction.aggregate([
      {
        $match: {
          type: 'income',
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
    ])

    const expenseAggregation = await Transaction.aggregate([
      {
        $match: {
          type: 'expense',
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
    ])

    const incomeTotal = await Transaction.aggregate([
      {
        $match: {
          type: 'income',
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ])

    const expenseTotal = await Transaction.aggregate([
      {
        $match: {
          type: 'expense',
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ])

    const balance = (incomeTotal[0]?.total || 0) - (expenseTotal[0]?.total || 0)

    res.json({
      income: incomeAggregation,
      expenses: expenseAggregation,
      incomeTotal: incomeTotal[0]?.total || 0,
      expenseTotal: expenseTotal[0]?.total || 0,
      balance,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

async function getTransaction(req, res, next) {
  let transaction
  try {
    transaction = await Transaction.findById(req.params.id)
    if (transaction == null) {
      return res.status(404).json({ message: 'Cannot find transaction' })
    }
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }

  res.transaction = transaction
  next()
}
