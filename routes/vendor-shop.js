const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db/connection');
const authenticate = require('../middleware/auth');

// 🔧 Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/shops/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.floor(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// ✅ Create Shop API
router.post(
  '/vendor/shop-create',
  authenticate,
  upload.fields([
    { name: 'shop_document', maxCount: 1 },
    { name: 'additional_document', maxCount: 1 }
  ]),
  (req, res) => {
    const vendor_id = req.user.id;
    const { shop_name, address, gst_number, pan_number, owner_name } = req.body;
    const files = req.files;

    const data = {
      vendor_id,
      shop_name,
      address,
      gst_number,
      pan_number,
      owner_name,
      shop_document: files?.shop_document?.[0]?.filename || '',
      additional_document: files?.additional_document?.[0]?.filename || ''
    };

    db.query('INSERT INTO vendor_shops SET ?', data, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Shop created successfully', id: result.insertId });
    });
  }
);

// ✅ Edit Shop API
router.put(
  '/vendor/shop-edit/:id',
  authenticate,
  upload.fields([
    { name: 'shop_document', maxCount: 1 },
    { name: 'additional_document', maxCount: 1 }
  ]),
  (req, res) => {
    const { id } = req.params;
    const vendor_id = req.user.id;
    const { shop_name, address, gst_number, pan_number, owner_name } = req.body;
    const files = req.files;

    const updatedData = {
      shop_name,
      address,
      gst_number,
      pan_number,
      owner_name
    };

    if (files?.shop_document) updatedData.shop_document = files.shop_document[0].filename;
    if (files?.additional_document) updatedData.additional_document = files.additional_document[0].filename;

    db.query(
      'UPDATE vendor_shops SET ? WHERE id = ? AND vendor_id = ?',
      [updatedData, id, vendor_id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Shop updated successfully' });
      }
    );
  }
);

// ✅ Get Shop API
router.get('/vendor/shop', authenticate, (req, res) => {
  const vendor_id = req.user.id;

  db.query(
    `SELECT *
    FROM vendor_shops WHERE vendor_id = ? LIMIT 1`,
    [vendor_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result[0] || {});
    }
  );
});

router.get('/vendor-orders', authenticate, (req, res) => {
    const vendor_id = req.user.id;
    const now = new Date();
  
    const sql = `
      SELECT o.*, p.name AS product_name, c.full_name AS customer_name
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users c ON o.customer_id = c.id
      WHERE p.vendor_id = ?
    `;
  
    db.query(sql, [vendor_id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
  
      const upcoming = [];
      const past = [];
  
      results.forEach(order => {
        const orderDate = new Date(order.delivery_date || order.order_date);
        (orderDate >= now ? upcoming : past).push(order);
      });
  
      res.json({ upcoming_orders: upcoming, past_orders: past });
    });
  });
  

  router.get('/vendor-analytics', authenticate, (req, res) => {
    const vendor_id = req.user.id;
  
    const sql = `
      SELECT 
        COUNT(*) AS total_orders,
        SUM(price) AS total_revenue,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_orders,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) AS shipped_orders,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered_orders
      FROM orders
      WHERE vendor_id = ?
    `;
  
    db.query(sql, [vendor_id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
  
      const stats = results[0] || {};
      res.json({
        total_orders: stats.total_orders || 0,
        total_revenue: stats.total_revenue || 0,
        pending_orders: stats.pending_orders || 0,
        shipped_orders: stats.shipped_orders || 0,
        delivered_orders: stats.delivered_orders || 0
      });
    });
  });
  
module.exports = router;
