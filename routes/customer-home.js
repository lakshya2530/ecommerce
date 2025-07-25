const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const authenticate = require('../middleware/auth');

router.get('/customer/home', async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads`;

    // 1. Get all categories with image
    const categories = await new Promise((resolve, reject) => {
      db.query('SELECT id, name, image FROM categories ORDER BY id DESC', (err, results) => {
        if (err) return reject(err);
        const formatted = results.map(c => ({
          ...c,
          image: c.image ? `${baseUrl}/categories/${c.image}` : ''
        }));
        resolve(formatted);
      });
    });

    // 2. Get vendor banners (ads)
    const vendorBanners = await new Promise((resolve, reject) => {
      db.query('SELECT image, image_link FROM vendor_ads ORDER BY id DESC LIMIT 10', (err, results) => {
        if (err) return reject(err);
        const formatted = results.map(ad => ({
          image: ad.image ? `${baseUrl}/vendor_ads/${ad.image}` : '',
          image_link: ad.image_link
        }));
        resolve(formatted);
      });
    });

    // 3. Get popular/latest products
    const products = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM products WHERE status = "active" ORDER BY id DESC LIMIT 10', (err, results) => {
        if (err) return reject(err);
        const formatted = results.map(p => ({
          ...p,
          images: JSON.parse(p.images || '[]').map(img => `${baseUrl}/products/${img}`),
          specifications: (() => {
            try {
              return JSON.parse(p.specifications || '[]');
            } catch (e) {
              return [];
            }
          })()
        }));
        resolve(formatted);
      });
    });

    // 4. Get vendor shop list
    const shops = await new Promise((resolve, reject) => {
      db.query('SELECT id, vendor_id, shop_name, address, gst_number, pan_number, owner_name, shop_document, additional_document FROM vendor_shops ORDER BY id DESC', (err, results) => {
        if (err) return reject(err);
        const formatted = results.map(s => ({
          ...s,
          shop_document: s.shop_document ? `${baseUrl}/vendor_shops/${s.shop_document}` : '',
          additional_document: s.additional_document ? `${baseUrl}/vendor_shops/${s.additional_document}` : ''
        }));
        resolve(formatted);
      });
    });

    res.json({
      categories,
      vendor_banners: vendorBanners,
      popular_products: products,
      shops
    });
  } catch (error) {
    console.error('Home page error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/customer/shops', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads`;
  
    const sql = `SELECT * FROM vendor_shops ORDER BY id DESC`;
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
  
      const formatted = results.map(shop => ({
        ...shop,
        shop_document: shop.shop_document ? `${baseUrl}/vendor_shops/${shop.shop_document}` : '',
        additional_document: shop.additional_document ? `${baseUrl}/vendor_shops/${shop.additional_document}` : ''
      }));
  
      res.json(formatted);
    });
  });

  router.get('/customer/products', (req, res) => {
    const { category, sub_category } = req.query;
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads`;
  
    let sql = 'SELECT * FROM products WHERE status = "active"';
    const values = [];
  
    if (category) {
      sql += ' AND category = ?';
      values.push(category);
    }
  
    if (sub_category) {
      sql += ' AND sub_category = ?';
      values.push(sub_category);
    }
  
    sql += ' ORDER BY id DESC';
  
    db.query(sql, values, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
  
      const formatted = results.map(p => ({
        ...p,
        images: JSON.parse(p.images || '[]').map(img => `${baseUrl}/products/${img}`),
        specifications: (() => {
          try {
            return JSON.parse(p.specifications || '[]');
          } catch (e) {
            return [];
          }
        })()
      }));
  
      res.json(formatted);
    });
  });
  

  
  router.post('/cart/add', authenticate, (req, res) => {
    const customer_id = req.user.id;
    const { product_id, quantity } = req.body;
  
    const sql = `INSERT INTO cart (customer_id, product_id, quantity) VALUES (?, ?, ?) 
                 ON DUPLICATE KEY UPDATE quantity = quantity + ?`;
  
    db.query(sql, [customer_id, product_id, quantity, quantity], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Product added/updated in cart' });
    });
  });
  

  router.patch('/cart/update', authenticate, (req, res) => {
    const customer_id = req.user.id;
    const { product_id, quantity } = req.body;
  
    const sql = `UPDATE cart SET quantity = ? WHERE customer_id = ? AND product_id = ?`;
    db.query(sql, [quantity, customer_id, product_id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Cart updated' });
    });
  });

  router.get('/cart/list', authenticate, (req, res) => {
    const customer_id = req.user.id;
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads`;
  
    const sql = `
      SELECT c.id as cart_id, c.quantity, p.id as product_id, p.name, p.selling_price, p.images
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.customer_id = ?
    `;
  
    db.query(sql, [customer_id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
  
      let totalAmount = 0;
  
      const cart = results.map(item => {
        const images = JSON.parse(item.images || '[]').map(img => `${baseUrl}/products/${img}`);
        const amount = item.selling_price * item.quantity;
        totalAmount += amount;
  
        return {
          cart_id: item.cart_id,
          product_id: item.product_id,
          name: item.name,
          quantity: item.quantity,
          selling_price: item.selling_price,
          amount,
          images
        };
      });
  
      res.json({
        cart,
        total_amount: totalAmount
      });
    });
  });

  router.delete('/cart/remove/:cart_id', authenticate, (req, res) => {
    const { cart_id } = req.params;
  
    db.query('DELETE FROM cart WHERE id = ?', [cart_id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Item removed from cart' });
    });
  });
  
  router.post('/place-order', authenticate, (req, res) => {
    const customer_id = req.user.id;
  
    db.query(
      `SELECT c.*, p.name, p.selling_price, p.vendor_id 
       FROM cart c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.customer_id = ?`, [customer_id],
      (err, cartItems) => {
        if (err) return res.status(500).json({ error: err.message });
        if (cartItems.length === 0) return res.status(400).json({ error: 'Cart is empty' });
  
        const order_number = 'ORD' + Date.now();
        const orderData = {
          order_number,
          customer_id,
          status: 'placed',
          order_date: new Date()
        };
  
        db.query('INSERT INTO orders SET ?', orderData, (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
  
          const order_id = result.insertId;
  
          const items = cartItems.map(item => ([
            order_id,
            item.product_id,
            item.vendor_id,
            item.quantity || 1,
            item.selling_price
          ]));
  
          db.query(
            `INSERT INTO order_items (order_id, product_id, vendor_id, quantity, price) VALUES ?`,
            [items],
            (err) => {
              if (err) return res.status(500).json({ error: err.message });
  
              db.query('DELETE FROM cart WHERE customer_id = ?', [customer_id]);
              res.json({ message: 'Order placed', order_number, total_items: cartItems.length });
            }
          );
        });
      }
    );
  });
  

  router.get('/customer-orders', authenticate, (req, res) => {
    const customer_id = req.user.id;
    const now = new Date();
  
    const sql = `
      SELECT 
        o.*, 
        p.name AS product_name, 
        p.images, 
        p.category,
        u.full_name AS vendor_name
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.vendor_id = u.id
      WHERE o.customer_id = ?
      ORDER BY o.order_date DESC
    `;
  
    db.query(sql, [customer_id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
  
      const upcoming = [];
      const past = [];
  
      results.forEach(order => {
        const deliveryDate = new Date(order.delivery_date || order.order_date);
        const images = (() => {
          try {
            return JSON.parse(order.images || '[]').map(
              img => `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/${img}`
            );
          } catch (e) {
            return [];
          }
        })();
  
        const formattedOrder = {
          ...order,
          images,
          product_name: order.product_name,
          vendor_name: order.vendor_name,
        };
  
        if (deliveryDate >= now) {
          upcoming.push(formattedOrder);
        } else {
          past.push(formattedOrder);
        }
      });
  
      res.json({ upcoming_orders: upcoming, past_orders: past });
    });
  });
  

  // GET /categories
router.get('/home/categories', (req, res) => {
  db.query('SELECT * FROM categories WHERE parent_id IS NULL', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Parse JSON labels
    const formatted = results.map(cat => ({
      ...cat,
      labels: (() => {
        try {
          return JSON.parse(cat.labels || '[]');
        } catch (e) {
          return [];
        }
      })()
    }));

    res.json(formatted);
  });
});

// GET /sub-categories/:parentId
router.get('/home/sub-categories/:parentId', (req, res) => {
  const { parentId } = req.params;

  db.query('SELECT * FROM categories WHERE parent_id = ?', [parentId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const formatted = results.map(cat => ({
      ...cat,
      labels: (() => {
        try {
          return JSON.parse(cat.labels || '[]');
        } catch (e) {
          return [];
        }
      })()
    }));

    res.json(formatted);
  });
});

  
module.exports = router;
