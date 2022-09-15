const express = require('express')
const { Sequelize, DataTypes } = require('sequelize')

// Cria a instância do sequelize para se conectar ao banco de dados
const db = new Sequelize('postgres://onebitcode:onebitcode@localhost:5432/black_inventory_api', {
  define: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
})

// Cria o model da tabela categories
const Category = db.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, { tableName: 'categories' })

// Cria o model da tabela items
const Item = db.define('Item', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, { tableName: 'items' })

// Cria a associação muitos-para-muitos entre categories e items
Category.belongsToMany(Item, { through: 'categories_items', as: 'items', foreignKey: 'category_id' })
Item.belongsToMany(Category, { through: 'categories_items', as: 'categories', foreignKey: 'item_id' })

// Cria o app do express
const app = express()

// Adiciona o middleware para fazer o parse do conteúdo json
app.use(express.json())

// Endpoint de listar todas as categorias
app.get('/categories', async function (req, res) {
  const categories = await Category.findAll()
  return res.json(categories)
})

// Endpoint de criar uma nova categoria
app.post('/categories', async function (req, res) {
  const { name } = req.body
  const category = await Category.create({ name })
  return res.status(201).json(category)
})

// Endpoint de obter uma categoria específica
app.get('/categories/:id', async function (req, res) {
  const { id } = req.params
  const category = await Category.findByPk(id, { include: 'items' })
  return res.json(category)
})

// Endpoint de atualizar uma categoria
app.put('/categories/:id', async function (req, res) {
  const { id } = req.params
  const { name } = req.body
  await Category.update({ name }, { where: { id } })
  return res.status(204).end()
})

// Endpoint de excluir uma categoria
app.delete('/categories/:id', async function (req, res) {
  const { id } = req.params
  await Category.destroy({ where: { id } })
  return res.status(204).end()
})

// Endpoint de listar todos os items
app.get('/items', async function (req, res) {
  const items = await Item.findAll()
  return res.json(items)
})

// Endpoint de criar um novo item
app.post('/items', async function (req, res) {
  const { name, quantity, category_ids } = req.body
  const item = await Item.create({ name, quantity })
  await item.addCategories(category_ids)
  return res.status(201).json(item)
})

// Endpoint de obter um item específico
app.get('/items/:id', async function (req, res) {
  const { id } = req.params
  const item = await Item.findByPk(id, { include: 'categories' })
  return res.json(item)
})

// Endpoint de atualizar o nome e as categorias de um item
app.put('/items/:id', async function (req, res) {
  const { id } = req.params
  const { name, category_ids } = req.body
  const item = await Item.findByPk(id)
  item.name = name
  await item.setCategories(category_ids)
  return res.status(204).end()
})

// Endpoint de adicionar mais unidades de um item específico
app.put('/items/:id/add', async function (req, res) {
  const { id } = req.params
  const { quantity } = req.query
  const item = await Item.findByPk(id)
  item.quantity += parseInt(quantity)
  await item.save()
  return res.json(item)
})

// Endpoint de remover unidades de um item específico
app.put('/items/:id/remove', async function (req, res) {
  const { id } = req.params
  const { quantity } = req.query
  const item = await Item.findByPk(id)
  item.quantity -= parseInt(quantity)
  await item.save()
  return res.json(item)
})

// Endpoint de excluir um item
app.delete('/items/:id', async function (req, res) {
  const { id } = req.params
  await Item.destroy({ where: { id } })
  return res.status(204).end()
})

// Define a porta onde a aplicação vai estar ouvindo
const PORT = process.env.PORT || 3000

// Inicia a aplicação
app.listen(PORT, function () {
  console.log(`Aplicação iniciada. Ouvindo na porta ${PORT}`)
})