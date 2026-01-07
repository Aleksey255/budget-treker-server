import express from 'express'
import Category from '../models/Category.js'

export const routerCategories = express.Router()

routerCategories.get('/', async (req, res) => {
  try {
    const categories = await Category.find()
    res.json(categories)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

routerCategories.post('/', async (req, res) => {
  const { name } = req.body
  if (!name || typeof name !== 'string') {
    return res
      .status(400)
      .json({ message: 'Name is required and must be a string' })
  }

  const category = new Category({ name })

  try {
    const newCategory = await category.save()
    res.status(201).json(newCategory)
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: 'Category with this name already exists' })
    }
    res.status(400).json({ message: err.message })
  }
})

async function findCategory(req, res, next) {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) {
      return res.status(404).json({ message: 'Cannot find category' })
    }
    req.category = category
    next()
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid category ID format' })
    }
    return res.status(500).json({ message: err.message })
  }
}

routerCategories.put('/:id', findCategory, async (req, res) => {
  const { name } = req.body

  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    return res.status(400).json({ message: 'Name must be a non-empty string' })
  }

  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      req.category._id,
      { name },
      { new: true, runValidators: true }
    )
    res.json(updatedCategory)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Category name already exists' })
    }
    res.status(400).json({ message: err.message })
  }
})

routerCategories.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id)
    if (!category) {
      return res.status(404).json({ message: 'Cannot find category' })
    }
    res.json({ message: 'Deleted Category' })
  } catch (err) {
    console.error('Error deleting category:', err)
    res.status(500).json({ message: err.message })
  }
})
