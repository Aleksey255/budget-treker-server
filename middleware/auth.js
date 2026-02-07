import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return res
      .status(401)
      .json({ message: 'Доступ запрещён. Требуется токен.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key')
    req.user = await User.findById(decoded.userId).select('-password')
    next()
  } catch (err) {
    res.status(401).json({ message: 'Неверный или просроченный токен.' })
  }
}
