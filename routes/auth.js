import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import sgMail from '@sendgrid/mail'
export const routerAuth = express.Router()

// Установи API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// sgMail.setDataResidency('eu');
// uncomment the above line if you are sending mail using a regional EU subuser

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

routerAuth.post('/forgot-password', async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ message: 'Email обязателен' })
  }

  try {
    const user = await User.findOne({ email })
    // Даже если пользователь не найден — не сообщаем об этом (безопасность)
    if (!user) {
      return res.json({ message: 'Если аккаунт существует, письмо отправлено' })
    }

    // Генерируем JWT для сброса пароля (действует 15 минут)
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '15m' }
    )

    const resetUrl = `${process.env.VITE_API_BASE_URL}/reset-password?token=${resetToken}`

    // Отправка через SendGrid
    await sgMail
      .send({
        to: user.email,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: 'Сброс пароля',
        text: 'Сброс пароля',
        html: `
        <h2>Запрос на сброс пароля</h2>
        <p>Чтобы изменить пароль, перейдите по ссылке:</p>
        <a href="${resetUrl}" target="_blank">Сбросить пароль</a>
        <p><small>Ссылка действует 15 минут.</small></p>
      `,
      })
      .then(() => {
        console.log('Email sent')
      })
      .catch(error => {
        console.error(error)
      })

    res.json({ message: 'Если аккаунт существует, письмо отправлено' })
  } catch (err) {
    console.error('Ошибка при отправке письма:', err)
    res.status(500).json({ message: 'Не удалось отправить письмо' })
  }
})

//  Сброс пароля по токену
routerAuth.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Токен и новый пароль обязательны' })
  }

  try {
    // Проверяем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key')

    const user = await User.findById(decoded.userId)
    if (!user) {
      return res.status(400).json({ message: 'Невозможно сбросить пароль' })
    }

    // Хэшируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    user.password = hashedPassword
    await user.save()

    res.json({ message: 'Пароль успешно изменён' })
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Срок действия ссылки истёк' })
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Недействительная ссылка' })
    }
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})
