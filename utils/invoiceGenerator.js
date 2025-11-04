// const PDFDocument = require('pdfkit');
// const fs = require('fs');
// const path = require('path');

// const generateInvoice = async (orderData) => {
//   return new Promise((resolve, reject) => {
//     try {
//       const invoiceDir = path.join(__dirname, '../uploads/invoices');
//       if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir, { recursive: true });

//       const invoiceFileName = `invoice_${orderData.order_number || Date.now()}.pdf`;
//       const filePath = path.join(invoiceDir, invoiceFileName);

//       const doc = new PDFDocument({ margin: 50 });

//       const stream = fs.createWriteStream(filePath);
//       doc.pipe(stream);

//       // HEADER
//       doc.fontSize(22).text("INVOICE", { align: "center" });
//       doc.moveDown(1);

//       // Order Info
//       doc.fontSize(12)
//         .text(`Invoice Number: ${orderData.order_number}`)
//         .text(`Date: ${new Date(orderData.order_date).toLocaleDateString()}`)
//         .text(`Customer: ${orderData.customer_name}`)
//         .text(`Vendor: ${orderData.vendor_name}`)
//         .moveDown();

//       // ITEMS TABLE
//       doc.fontSize(14).text("Items", { underline: true });
//       doc.moveDown(0.5);

//       orderData.items.forEach((item, index) => {
//         doc.fontSize(12)
//           .text(`${index + 1}. ${item.product_name}`)
//           .text(`   Qty: ${item.quantity} | Price: ₹${item.price}`)
//           .moveDown(0.2);
//       });

//       doc.moveDown(1);
//       doc.fontSize(14).text(`Total Amount: ₹${orderData.total}`, { align: 'right' });

//       // FOOTER
//       doc.moveDown(2);
//       doc.fontSize(10).text("Thank you for shopping with us!", { align: "center" });

//       doc.end();

//       stream.on('finish', () => resolve(`/uploads/invoices/${invoiceFileName}`));
//       stream.on('error', (err) => reject(err));

//     } catch (err) {
//       reject(err);
//     }
//   });
// };

// module.exports = { generateInvoice };


// const fs = require('fs');
// const path = require('path');
// const puppeteer = require('puppeteer');
// const pdf = require('html-pdf-node');

// /**
//  * Generate invoice PDF from HTML template
//  * @param {Object} data - orderData
//  * @returns {Promise<string>} relative file path
//  */
// const generateInvoice = async (data) => {
//   try {
//     const invoiceDir = path.join(__dirname, '../uploads/invoices');
//     if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir, { recursive: true });

//     const fileName = `invoice_${data.order_number || Date.now()}.pdf`;
//     const filePath = path.join(invoiceDir, fileName);

//     // 🧾 HTML Template
//     const htmlContent = `
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <meta charset="utf-8">
//       <title>Invoice - ${data.order_number}</title>
//       <style>
//         body {
//           font-family: 'Helvetica Neue', Arial, sans-serif;
//           color: #333;
//           margin: 0;
//           padding: 0;
//           background: #f8f9fa;
//         }
//         .invoice-box {
//           max-width: 800px;
//           margin: 30px auto;
//           background: #fff;
//           padding: 30px;
//           border: 1px solid #eee;
//           box-shadow: 0 0 10px rgba(0,0,0,0.15);
//           line-height: 24px;
//           font-size: 14px;
//         }
//         .header {
//           text-align: center;
//           border-bottom: 2px solid #007BFF;
//           padding-bottom: 10px;
//           margin-bottom: 20px;
//         }
//         .header h1 {
//           margin: 0;
//           color: #007BFF;
//         }
//         .details {
//           display: flex;
//           justify-content: space-between;
//           margin-bottom: 20px;
//         }
//         .details div {
//           width: 48%;
//         }
//         .table {
//           width: 100%;
//           border-collapse: collapse;
//           margin-top: 20px;
//         }
//         .table th, .table td {
//           border: 1px solid #ddd;
//           padding: 10px;
//           text-align: left;
//         }
//         .table th {
//           background-color: #007BFF;
//           color: #fff;
//         }
//         .total {
//           text-align: right;
//           margin-top: 30px;
//         }
//         .footer {
//           text-align: center;
//           font-size: 12px;
//           margin-top: 40px;
//           color: #777;
//         }
//       </style>
//     </head>
//     <body>
//       <div class="invoice-box">
//         <div class="header">
//           <h1>INVOICE</h1>
//           <p><strong>Invoice No:</strong> ${data.order_number}</p>
//           <p><strong>Date:</strong> ${new Date(data.order_date).toLocaleDateString()}</p>
//         </div>

//         <div class="details">
//           <div>
//             <h3>Bill To:</h3>
//             <p>${data.customer_name || "Customer"}</p>
//             <p>${data.customer_address || ""}</p>
//           </div>
//           <div>
//             <h3>Vendor:</h3>
//             <p>${data.vendor_name || "Vendor"}</p>
//             <p>${data.vendor_phone || ""}</p>
//           </div>
//         </div>

//         <table class="table">
//           <thead>
//             <tr>
//               <th>#</th>
//               <th>Product</th>
//               <th>Qty</th>
//               <th>Price (₹)</th>
//               <th>Total (₹)</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${data.items.map((item, i) => `
//               <tr>
//                 <td>${i + 1}</td>
//                 <td>${item.product_name}</td>
//                 <td>${item.quantity}</td>
//                 <td>${item.price}</td>
//                 <td>${(item.price * item.quantity).toFixed(2)}</td>
//               </tr>
//             `).join('')}
//           </tbody>
//         </table>

//         <div class="total">
//           <p><strong>Subtotal:</strong> ₹${data.items.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2)}</p>
//           <p><strong>GST (18%):</strong> ₹${(data.items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 0.18).toFixed(2)}</p>
//           <h2>Grand Total: ₹${(data.items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 1.18).toFixed(2)}</h2>
//         </div>

//         <div class="footer">
//           <p>Thank you for your order!</p>
//           <p>For support, contact support@yourstore.com</p>
//         </div>
//       </div>
//     </body>
//     </html>
//     `;

//     // 🧾 Generate PDF
//     const browser = await puppeteer.launch({
//       headless: "new",
//       args: ["--no-sandbox", "--disable-setuid-sandbox"]
//     });
//     const page = await browser.newPage();
//     await page.setContent(htmlContent, { waitUntil: "networkidle0" });
//     await page.pdf({ path: filePath, format: "A4", printBackground: true });
//     await browser.close();

//     return `/uploads/invoices/${fileName}`;
//   } catch (err) {
//     console.error("Invoice generation failed:", err);
//     throw err;
//   }
// };




const fs = require('fs');
const path = require('path');
const pdf = require('html-pdf-node');

const generateInvoiceHTML = (orderData) => `
  <html>
  <head>
    <style>
      body { font-family: Arial; padding: 20px; }
      h1 { text-align: center; color: #333; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f4f4f4; }
    </style>
  </head>
  <body>
    <h1>Invoice</h1>
    <p><strong>Order Number:</strong> ${orderData.order_number}</p>
    <p><strong>Date:</strong> ${new Date(orderData.order_date).toLocaleDateString()}</p>
    <table>
      <tr><th>#</th><th>Product</th><th>Qty</th><th>Price</th></tr>
      ${orderData.items.map((i, idx) => `
        <tr><td>${idx + 1}</td><td>${i.product_name}</td><td>${i.quantity}</td><td>₹${i.price}</td></tr>
      `).join('')}
    </table>
    <h3 style="text-align:right;">Total: ₹${orderData.total}</h3>
  </body>
  </html>
`;

const generateInvoice = async (orderData) => {
  const filePath = path.join(__dirname, `../uploads/invoices/invoice_${orderData.order_number}.pdf`);
  const html = generateInvoiceHTML(orderData);

  const file = { content: html };
  const pdfBuffer = await pdf.generatePdf(file, { format: 'A4' });
  fs.writeFileSync(filePath, pdfBuffer);

  return `/uploads/invoices/invoice_${orderData.order_number}.pdf`;
};


module.exports = { generateInvoice };
