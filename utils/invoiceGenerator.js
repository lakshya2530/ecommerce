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


const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generateInvoice = async (orderData) => {
  return new Promise((resolve, reject) => {
    try {
      const invoiceDir = path.join(__dirname, "../uploads/invoices");
      if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir, { recursive: true });

      const invoiceFileName = `invoice_${orderData.order_number || Date.now()}.pdf`;
      const filePath = path.join(invoiceDir, invoiceFileName);

      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // ===== HEADER SECTION =====
      const logoPath = path.join(__dirname, "../uploads/logo.jpg");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 30, { width: 80 });
      }

      doc
        .fontSize(22)
        .fillColor("#222")
        .text("INVOICE", 0, 40, { align: "right" });

      doc
        .fontSize(10)
        .fillColor("#444")
        .text(`Invoice #: ${orderData.order_number}`, { align: "right" })
        .text(`Date: ${new Date(orderData.order_date).toLocaleDateString()}`, { align: "right" })
        .moveDown(2);

      // ===== BILLING SECTION =====
      const topY = doc.y;
      doc
        .fontSize(12)
        .fillColor("#000")
        .text("Bill To:", 40)
        .fontSize(10)
        .fillColor("#333")
        .text(orderData.customer_name)
        .text(orderData.customer_address || "No address provided");

      doc
        .fontSize(12)
        .fillColor("#000")
        .text("Vendor:", 320, topY)
        .fontSize(10)
        .fillColor("#333")
        .text(orderData.vendor_name, 320)
        .text(orderData.vendor_address || "No address provided");

      doc.moveDown(2);

      // ===== TABLE HEADER =====
      const tableTop = doc.y;
      doc
        .fontSize(11)
        .fillColor("#fff")
        .rect(40, tableTop, 520, 25)
        .fill("#1976D2");

      const headerY = tableTop + 8;
      doc
        .fillColor("#fff")
        .text("S.No", 50, headerY)
        .text("Product", 100, headerY)
        .text("Qty", 330, headerY)
        .text("Price", 390, headerY)
        .text("Total", 470, headerY);

      doc.moveDown(2).fillColor("#000");

      // ===== TABLE ROWS =====
      let totalAmount = 0;
      const rowSpacing = 20;
      orderData.items.forEach((item, i) => {
        const y = doc.y;

        // Prevent overflow (if too many items)
        if (y > 700) {
          doc.addPage();
          doc.y = 100;
        }

        const itemTotal = parseFloat(item.price) * parseInt(item.quantity);
        totalAmount += itemTotal;

        doc
          .fontSize(10)
          .fillColor("#000")
          .text(i + 1, 50, y)
          .text(item.product_name, 100, y)
          .text(item.quantity.toString(), 340, y)
          .text(`₹${Number(item.price).toFixed(2)}`, 395, y)
          .text(`₹${itemTotal.toFixed(2)}`, 470, y);

        doc.moveDown(0.6);
      });

      // ===== SUBTOTALS =====
      doc.moveDown(2);
      const totalsY = doc.y;
      const gst = totalAmount * 0.18;
      const grandTotal = totalAmount + gst;

      doc
        .fontSize(11)
        .fillColor("#000")
        .text("Subtotal:", 380, totalsY)
        .text(`₹${totalAmount.toFixed(2)}`, 470, totalsY, { align: "right" })
        .text("GST (18%):", 380, totalsY + 15)
        .text(`₹${gst.toFixed(2)}`, 470, totalsY + 15, { align: "right" })
        .font("Helvetica-Bold")
        .text("Grand Total:", 380, totalsY + 30)
        .text(`₹${grandTotal.toFixed(2)}`, 470, totalsY + 30, { align: "right" });

      // ===== FOOTER =====
      doc
        .moveDown(4)
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#555")
        .text("Thank you for shopping with us!", { align: "center" })
        .moveDown(0.3)
        .text("This is a system-generated invoice and does not require a signature.", {
          align: "center",
        });

      // Finish
      doc.end();

      stream.on("finish", () => resolve(`/uploads/invoices/${invoiceFileName}`));
      stream.on("error", (err) => reject(err));

    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoice };


