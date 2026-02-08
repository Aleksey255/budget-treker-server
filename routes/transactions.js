import express from 'express'
import { auth } from '../middleware/auth.js'
import Transaction from '../models/Transaction.js'

export const routerTransactions = express.Router()

routerTransactions.use(auth) // ← все маршруты теперь защищены

routerTransactions.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort({
      date: -1,
    })
    res.json(transactions)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

routerTransactions.post('/', async (req, res) => {
  try {
    const { type, amount, categoryId, categoryName, description, date } =
      req.body

    // Валидация обязательных полей
    if (!type || !amount || !categoryId || !categoryName) {
      return res
        .status(400)
        .json({ message: 'Тип, сумма и категория обязательны' })
    }

    // Проверка типа
    if (!['income', 'expense'].includes(type)) {
      return res
        .status(400)
        .json({ message: 'Тип должен быть "income" или "expense"' })
    }

    const transaction = new Transaction({
      type,
      amount: Number(amount),
      categoryId, // ← сейчас это строка (ID категории)
      categoryName: categoryName,
      description: description || '',
      date: date ? new Date(date) : new Date(),
      user: req.user._id, // ← привязка к пользователю
    })

    const newTransaction = await transaction.save()
    res.status(201).json(newTransaction)
  } catch (err) {
    console.error(err)
    res.status(400).json({ message: err.message })
  }
})

async function findTransaction(req, res, next) {
  try {
    const transaction = await Transaction.findById(req.params.id)
    if (!transaction) {
      return res.status(404).json({ message: 'Cannot find transaction' })
    }
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Нет доступа' })
    }
    req.transaction = transaction
    next()
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

routerTransactions.put('/:id', findTransaction, async (req, res) => {
  const updates = {}
  const updatableFields = ['type', 'amount', 'category', 'description', 'date']

  updatableFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field]
    }
  })

  try {
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.transaction._id,
      updates,
      { new: true, runValidators: true }
    )
    if (updatedTransaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Нет доступа к этой транзакции' })
    }
    res.json(updatedTransaction)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

routerTransactions.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id)

    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Нет доступа к этой транзакции' })
    }

    if (!transaction) {
      return res.status(404).json({ message: 'Cannot find transaction' })
    }

    res.json({ message: 'Deleted Transaction' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

routerTransactions.get('/reports', async (req, res) => {
  const { startDate, endDate } = req.query
  const start = startDate ? new Date(startDate) : new Date('2000-01-01')
  const end = endDate ? new Date(endDate) : new Date()

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ message: 'Invalid date format' })
  }

  try {
    // Объединённая агрегация: эффективнее, чем 4 отдельных запроса
    const result = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { type: '$type', category: '$categoryName' },
          total: { $sum: '$amount' },
        },
      },
      {
        $group: {
          _id: '$_id.type',
          categories: {
            $push: {
              category: '$_id.category',
              total: '$total',
            },
          },
          totalAmount: { $sum: '$total' },
        },
      },
    ])

    const incomeData = result.find(r => r._id === 'income') || {
      categories: [],
      totalAmount: 0,
    }
    const expenseData = result.find(r => r._id === 'expense') || {
      categories: [],
      totalAmount: 0,
    }

    const balance = incomeData.totalAmount - expenseData.totalAmount

    res.json({
      income: incomeData.categories,
      expenses: expenseData.categories,
      incomeTotal: incomeData.totalAmount,
      expenseTotal: expenseData.totalAmount,
      balance,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})
