
// const express = require('express');
// const cors = require('cors');
// const fs = require('fs');
// require('dotenv').config();
// const { Server } = require('socket.io');

// const app = express();

// let server;
// if (process.env.NODE_ENV === 'production') {
//   const https = require('https');
//   const options = {
//     key: fs.readFileSync('private-key.pem'),
//     cert: fs.readFileSync('certificate.pem'),
//   };
//   server = https.createServer(options, app);
// } else {
//   const http = require('http');
//   server = http.createServer(app);
// }

// // Initialize Socket.IO with the server
// const io = new Server(server, {
//   cors: {
//     origin: '*',
//     methods: ['GET', 'POST'],
//   },
// });


// // Middleware
// app.use(cors());
// app.use(express.json());
// // app.use((req, res, next) => {
// //   if (req.headers['x-forwarded-proto'] !== 'https') {
// //     return res.redirect('https://' + req.headers.host + req.url);
// //   }
// //   next();
// // });

// // Routes

// const userAdminDashboardRoutes = require('./routes/admin');
// const productRoutes = require('./routes/product');

// //Admin
// app.use('/admin', userAdminDashboardRoutes);
// app.use('/admin', productRoutes);
// app.use('/uploads', express.static('uploads'));


// // Socket.io real-time logic
// // io.on('connection', (socket) => {
// //   console.log('User connected:', socket.id);

// //   socket.on('join', (userId) => {
// //     socket.join(userId);
// //     console.log(`User ${userId} joined their room`);
// //   });

// //   socket.on('send_message', (data) => {
// //     const { sender_id, receiver_id, content } = data;

// //     io.to(receiver_id).emit('receive_message', {
// //       sender_id,
// //       receiver_id,
// //       content,
// //       created_at: new Date()
// //     });

// //     console.log(`Message from ${sender_id} to ${receiver_id}: ${content}`);
// //   });

// //   socket.on('disconnect', () => {
// //     console.log('User disconnected:', socket.id);
// //   });
// // });

// // ✅ Corrected: start server with Socket.IO attached
// server.listen(3000, () => {
//   console.log('Server running on port 3000');
// });









const express = require('express');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();
const { Server } = require('socket.io');

const app = express();
let server;

// ⚙️ Determine environment
if (process.env.NODE_ENV === 'production') {
  const https = require('https');

  // ✅ Ensure these files exist (generate with OpenSSL if needed)
  const options = {
    key: fs.readFileSync('./ssl/private-key.pem'),
    cert: fs.readFileSync('./ssl/certificate.pem'),
  };

  server = https.createServer(options, app);
  console.log('🚀 Running in HTTPS (production) mode');
} else {
  const http = require('http');
  server = http.createServer(app);
  console.log('🚀 Running in HTTP (development) mode');
}

// ✅ Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// 🌐 Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// 🛣️ Routes
const userAdminDashboardRoutes = require('./routes/admin');
const productRoutes = require('./routes/product');
const vendorAuthRoutes = require('./routes/vendor-auth');
const vendorShopRoutes = require('./routes/vendor-shop');
const vendorProductRoutes = require('./routes/vendor-product');
const vendorAdRoutes = require('./routes/vendor-ads');

app.use('/admin', userAdminDashboardRoutes);
app.use('/admin', productRoutes);
app.use('/api', vendorAuthRoutes);
app.use('/api', vendorShopRoutes);
app.use('/api/vendor', vendorProductRoutes);
app.use('/api', vendorAdRoutes);

// 💬 Real-time socket handling
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('send_message', (data) => {
    const { sender_id, receiver_id, content } = data;

    io.to(receiver_id).emit('receive_message', {
      sender_id,
      receiver_id,
      content,
      created_at: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// 🚀 Start server
server.listen(3000, () => {
  console.log(`✅ Server running on port 3000`);
});
