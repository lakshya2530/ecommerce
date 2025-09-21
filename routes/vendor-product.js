const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/connection'); // adjust path if needed
const authenticate = require('../middleware/auth');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/products';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { files: 5 } });

// Create Product
// router.post('/product-create',authenticate, upload.array('images', 5), (req, res) => {
//   const { name, description, actual_price,selling_price,quantity,type, category,sub_category, specifications, status = 'active' } = req.body;
//   const images = req.files.map(file => file.filename);
//   let parsedSpecs = [];
//   const vendor_id = req.user.id;

//   try {
//     parsedSpecs = typeof req.body.specifications === 'string'
//       ? JSON.parse(req.body.specifications)
//       : req.body.specifications;
//   } catch (e) {
//     parsedSpecs = [];
//   }
  
//   const product = {
//     vendor_id,
//     name,
//     description,
//     actual_price,
//     selling_price,
//     type,
//     category,
//     sub_category,
//     quantity,
//     images: JSON.stringify(images),
//     specifications: JSON.stringify(parsedSpecs), // save as JSON string
//     status
//   };

//   db.query('INSERT INTO products SET ?', product, (err, result) => {
//     if (err) return res.status(500).json({ error: err.message });
//     res.json({ message: 'Product created', id: result.insertId });
//   });
// });

// router.post('/bulk-product-create', upload.array('images'), (req, res) => {
//   const files = req.files;
//   const products = JSON.parse(req.body.products);

//   // Prepare values for bulk insert
//   const values = products.map(product => {
//     // Map image filenames
//     const productImages = product.image_keys.map(filename => {
//       const match = files.find(file => file.originalname === filename);
//       return match ? match.filename : null;
//     }).filter(Boolean); // remove nulls

//     // Safely stringify specifications
//     const specifications = (() => {
//       try {
//         return JSON.stringify(product.specifications || []);
//       } catch (e) {
//         return '[]';
//       }
//     })();

//     return [
//       product.name,
//       product.description,
//       product.actual_price,
//       product.selling_price,
//       product.type,
//       product.category,
//       product.sub_category,
//       product.quantity,
//       JSON.stringify(productImages), // images
//       product.status || 'active',
//       specifications // ✅ NEW field
//     ];
//   });

//   const sql = `
//     INSERT INTO products 
//     (name, description, actual_price, selling_price,type, category,sub_category,quantity, images, status, specifications) 
//     VALUES ?
//   `;

//   db.query(sql, [values], (err, result) => {
//     if (err) return res.status(500).json({ error: err.message });
//     res.json({
//       message: 'Bulk products uploaded with images and specifications',
//       inserted: result.affectedRows
//     });
//   });
// });

router.post('/product-create', authenticate, upload.array('images', 5), (req, res) => {
  const { 
    name, description, actual_price, selling_price, quantity, type, category, sub_category, 
    specifications, status = 'active',
    gst_applicable = 'NO', gst_code = null,
    product_condition = 'new', model_name = null, size = null, color = null, weight = null,
    discount_percentage = 0, return_policy = 'not_returnable', return_days = null
  } = req.body;

  const images = req.files.map(file => file.filename);
  const vendor_id = req.user.id;

  let parsedSpecs = [];
  try {
    parsedSpecs = typeof specifications === 'string' ? JSON.parse(specifications) : specifications;
  } catch (e) {
    parsedSpecs = [];
  }

  const product = {
    vendor_id,
    name,
    description,
    actual_price,
    selling_price,
    type,
    category,
    sub_category,
    quantity,
    images: JSON.stringify(images),
    specifications: JSON.stringify(parsedSpecs),
    status,
    gst_applicable,
    gst_code,
    product_condition,
    model_name,
    size,
    color,
    weight,
    discount_percentage,
    return_policy,
    return_days: return_policy === 'not_returnable' ? null : return_days
  };

  db.query('INSERT INTO products SET ?', product, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Product created', id: result.insertId });
  });
});


router.post('/bulk-product-create', authenticate, upload.array('images'), (req, res) => {
  const vendor_id = req.user.id;
  const files = req.files;
  let products = [];

  try {
    products = JSON.parse(req.body.products);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid products JSON' });
  }

  const values = products.map(product => {
    const productImages = (product.image_keys || []).map(filename => {
      const match = files.find(file => file.originalname === filename);
      return match ? match.filename : null;
    }).filter(Boolean);

    const specifications = (() => {
      try {
        return JSON.stringify(product.specifications || []);
      } catch (e) {
        return '[]';
      }
    })();

    return [
      vendor_id,
      product.name,
      product.description,
      product.actual_price,
      product.selling_price,
      product.type,
      product.category,
      product.sub_category,
      product.quantity,
      JSON.stringify(productImages),
      product.status || 'active',
      specifications,
      product.gst_applicable || 'NO',
      product.gst_code || null,
      product.product_condition || 'new',
      product.model_name || null,
      product.size || null,
      product.color || null,
      product.weight || null,
      product.discount_percentage || 0,
      product.return_policy || 'not_returnable',
      product.return_policy === 'not_returnable' ? null : (product.return_days || null)
    ];
  });

  const sql = `
    INSERT INTO products 
    (vendor_id, name, description, actual_price, selling_price, type, category, sub_category, quantity, images, status, specifications,
     gst_applicable, gst_code, product_condition, model_name, size, color, weight, discount_percentage, return_policy, return_days) 
    VALUES ?
  `;

  db.query(sql, [values], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      status: true,
      message: 'Bulk products uploaded with GST, condition, and return days',
      inserted: result.affectedRows
    });
  });
});



router.get('/product-list', authenticate, (req, res) => {
    const { category } = req.query;
    const vendor_id = req.user.id;
  
    function getProducts(categoryId = null) {
      let sql = 'SELECT * FROM products WHERE vendor_id = ?';
      const values = [vendor_id];
  
      if (categoryId !== null) {
        sql += ' AND category = ?';
        values.push(categoryId);
      }
  
      sql += ' ORDER BY id DESC';
  
      db.query(sql, values, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
  
        const formatted = results.map(p => ({
          ...p,
          images: JSON.parse(p.images || '[]'),
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
    }
  
    if (!category) return getProducts();
  
    const sql = 'SELECT id FROM categories WHERE LOWER(name) = ?';
    db.query(sql, [category.toLowerCase()], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.length === 0) return res.json([]);
      getProducts(result[0].id);
    });
  });
  

  router.put('/product-update/:id', authenticate, upload.array('images', 5), (req, res) => {
    const { id } = req.params;
    const vendor_id = req.user.id;
  
    const {
      name,
      description,
      actual_price,
      selling_price,
      quantity,
      type,
      category,
      sub_category,
      specifications,
      status,
      gst_applicable,
      gst_code,
      product_condition,
      model_name,
      size,
      color,
      weight,
      discount_percentage,
      return_policy,
      return_days
    } = req.body;
  
    const updatedData = {
      name,
      description,
      actual_price,
      selling_price,
      quantity,
      type,
      category,
      sub_category,
      status,
      gst_applicable,
      gst_code,
      product_condition,
      model_name,
      size,
      color,
      weight,
      discount_percentage,
      return_policy,
      return_days: return_policy === 'not_returnable' ? null : return_days
    };
  
    // Handle images if uploaded
    if (req.files?.length) {
      updatedData.images = JSON.stringify(req.files.map(file => file.filename));
    }
  
    // Handle specifications JSON
    if (specifications) {
      try {
        updatedData.specifications = JSON.stringify(
          typeof specifications === 'string' ? JSON.parse(specifications) : specifications
        );
      } catch {
        return res.status(400).json({ error: 'Invalid specifications format' });
      }
    }
  
    // Remove undefined keys
    Object.keys(updatedData).forEach(
      key => (updatedData[key] === undefined || updatedData[key] === null) && delete updatedData[key]
    );
  
    const sql = 'UPDATE products SET ? WHERE id = ? AND vendor_id = ?';
    db.query(sql, [updatedData, id, vendor_id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Product not found or not owned by vendor' });
      }
      res.json({ message: 'Product updated successfully' });
    });
  });
  
  
  // router.put('/product-update/:id', authenticate, upload.array('images', 5), (req, res) => {
  //   const { id } = req.params;
  //   const vendor_id = req.user.id;
  //   const { name, description, actual_price, selling_price, quantity,type, category,sub_category, specifications, status } = req.body;
  
  //   const updatedData = { name, description, actual_price, selling_price, quantity, category,sub_category, status };
  
  //   if (req.files?.length) {
  //     updatedData.images = JSON.stringify(req.files.map(file => file.filename));
  //   }
  
  //   if (specifications) {
  //     try {
  //       updatedData.specifications = JSON.stringify(JSON.parse(specifications));
  //     } catch {
  //       return res.status(400).json({ error: 'Invalid specifications format' });
  //     }
  //   }
  
  //   const sql = 'UPDATE products SET ? WHERE id = ? AND vendor_id = ?';
  //   db.query(sql, [updatedData, id, vendor_id], (err) => {
  //     if (err) return res.status(500).json({ error: err.message });
  //     res.json({ message: 'Product updated' });
  //   });
  // });
  
  
  router.delete('/product-delete/:id', authenticate, (req, res) => {
    const { id } = req.params;
    const vendor_id = req.user.id;
  
    db.query('DELETE FROM products WHERE id = ? AND vendor_id = ?', [id, vendor_id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Product deleted' });
    });
  });
  

  
  router.patch('/product-status/:id', authenticate, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const vendor_id = req.user.id;
  
    db.query('UPDATE products SET status = ? WHERE id = ? AND vendor_id = ?', [status, id, vendor_id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Status updated' });
    });
  });
  
  module.exports = router;
