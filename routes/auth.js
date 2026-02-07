import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export const routerAuth = express.Router()

// Регистрация
routerAuth.post('/register', async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Имя, email и пароль обязательны' })
  }

  try {
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'Пользователь с таким email уже существует' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = new User({ name, email, password: hashedPassword })
    await user.save()

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'secret-key',
      {
        expiresIn: '7d',
      }
    )

    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера при регистрации' })
  }
})

// Вход
routerAuth.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email и пароль обязательны' })
  }

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: 'Неверный email или пароль' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверный email или пароль' })
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'secret-key',
      {
        expiresIn: '7d',
      }
    )

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера при входе' })
  }
})

// Получение текущего пользователя
routerAuth.get('/me', async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ message: 'Токен отсутствует' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key')
    const user = await User.findById(decoded.userId).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' })
    }
    res.json(user)
  } catch (err) {
    res.status(401).json({ message: 'Неверный токен' })
  }
})
