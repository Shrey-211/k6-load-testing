const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(morgan('dev'));

// Simulated product catalog
const products = [
  { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics' },
  { id: 2, name: 'Smartphone', price: 699.99, category: 'Electronics' },
  { id: 3, name: 'Headphones', price: 199.99, category: 'Audio' },
  { id: 4, name: 'Book', price: 29.99, category: 'Books' },
  { id: 5, name: 'T-Shirt', price: 19.99, category: 'Clothing' },
];

let carts = {}; // session_token -> cart

// GET endpoint
app.get('/get', (req, res) => {
  const { product_id, search, action, flash_sale_product } = req.query;

  if (product_id) {
    const product = products.find(p => p.id == product_id);
    return res.json({ product_id, product });
  }

  if (flash_sale_product) {
    return res.json({
      product_id: flash_sale_product,
      name: 'Flash Sale Product',
      stock: Math.random() < 0.9 ? 1 : 0
    });
  }

  if (search) {
    const results = products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
    return res.json({ query: search, results });
  }

  if (action === 'view_cart') {
    const sessionToken = req.headers.authorization?.split(' ')[1];
    return res.json({ session_token: sessionToken, cart: carts[sessionToken] || [] });
  }

  res.json({ message: 'Welcome to E-commerce API!' });
});

// POST endpoint
app.post('/post', (req, res) => {
  const { username, password, action, product_id, quantity, session_token } = req.body;

  if (username && password) {
    // Simulate login success
    return res.json({ message: 'Login successful', session_token: `session-${Date.now()}` });
  }

  if (action === 'add_to_cart') {
    if (!carts[session_token]) carts[session_token] = [];
    carts[session_token].push({ product_id, quantity });
    return res.json({ message: 'Item added to cart' });
  }

  if (action === 'checkout') {
    const items = carts[session_token] || [];
    delete carts[session_token];
    return res.json({ message: 'Checkout successful', items });
  }

  if (action === 'quick_add') {
    // Simulate flash sale success/failure
    const success = Math.random() > 0.1;
    return res.status(success ? 200 : 409).json({
      message: success ? 'Flash sale item added' : 'Out of stock'
    });
  }

  res.status(400).json({ error: 'Unknown POST action' });
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
