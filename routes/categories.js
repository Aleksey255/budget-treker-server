import express from 'express'
import Category  from '../models/Category.js'

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
  const category = new Category({
    name: req.body.name,
  })

  try {
    const newCategory = await category.save()
    res.status(201).json(newCategory)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

routerCategories.put('/:id', getCategory, async (req, res) => {
  if (req.body.name != null) {
    res.category.name = req.body.name
  }

  try {
    const updatedCategory = await res.category.save()
    res.json(updatedCategory)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

routerCategories.delete('/:id', getCategory, async (req, res) => {
  try {
    await res.category.remove()
    res.json({ message: 'Deleted Category' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

async function getCategory(req, res, next) {
  let category
  try {
    category = await Category.findById(req.params.id)
    if (category == null) {
      return res.status(404).json({ message: 'Cannot find category' })
    }
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }

  res.category = category
  next()
}
