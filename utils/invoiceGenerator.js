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

      const doc = new PDFDocument({ margin: 40 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // ---- HEADER SECTION ----
      const logoPath = path.join(__dirname, "../uploads/logo.png"); // ✅ make sure logo exists
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 30, { width: 80 });
      }

      doc
        .fontSize(22)
        .fillColor("#333333")
        .text("INVOICE", 0, 50, { align: "right" });

      doc
        .fontSize(10)
        .fillColor("#555")
        .text(`Invoice #: ${orderData.order_number}`, { align: "right" })
        .text(`Date: ${new Date(orderData.order_date).toLocaleDateString()}`, { align: "right" })
        .moveDown(2);

      // ---- BILLING INFO ----
      doc
        .fontSize(12)
        .fillColor("#000")
        .text("BILL TO:", 40)
        .fontSize(10)
        .text(orderData.customer_name)
        .text(orderData.customer_address || "No address provided")
        .moveDown(1);

      doc
        .fontSize(12)
        .text("VENDOR:", 300)
        .fontSize(10)
        .text(orderData.vendor_name, 300)
        .text(orderData.vendor_address || "No address provided")
        .moveDown(2);

      // ---- TABLE HEADER ----
      doc
        .fontSize(12)
        .fillColor("#ffffff")
        .rect(40, doc.y, 520, 25)
        .fill("#4A90E2")
        .fillColor("#fff")
        .text("S.No", 45, doc.y + 7)
        .text("Product", 100, doc.y + 7)
        .text("Qty", 330, doc.y + 7)
        .text("Price", 380, doc.y + 7)
        .text("Total", 460, doc.y + 7);

      doc.moveDown(1.5).fillColor("#000");

      // ---- TABLE ROWS ----
      let totalAmount = 0;
      orderData.items.forEach((item, i) => {
        const y = doc.y;
        const itemTotal = item.quantity * item.price;
        totalAmount += itemTotal;

        doc
          .fontSize(10)
          .fillColor("#000")
          .text(i + 1, 45, y)
          .text(item.product_name, 100, y)
          .text(item.quantity.toString(), 340, y)
          .text(`₹${item.price.toFixed(2)}`, 390, y)
          .text(`₹${itemTotal.toFixed(2)}`, 470, y);
        doc.moveDown(0.7);
      });

      doc.moveDown(1);

      // ---- TOTALS SECTION ----
      doc
        .fontSize(12)
        .fillColor("#333")
        .text("Subtotal:", 380, doc.y + 10)
        .text(`₹${totalAmount.toFixed(2)}`, 470, doc.y + 10, { align: "right" });

      const gst = totalAmount * 0.18; // example GST 18%
      const grandTotal = totalAmount + gst;

      doc
        .text("GST (18%):", 380, doc.y + 20)
        .text(`₹${gst.toFixed(2)}`, 470, doc.y + 20, { align: "right" })
        .font("Helvetica-Bold")
        .text("Grand Total:", 380, doc.y + 30)
        .text(`₹${grandTotal.toFixed(2)}`, 470, doc.y + 30, { align: "right" });

      doc.moveDown(2);

      // ---- FOOTER ----
      doc
        .moveDown(2)
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#666")
        .text(
          "Thank you for your purchase! Please contact us for any queries related to your order.",
          { align: "center" }
        )
        .moveDown(0.5)
        .text("This is a system-generated invoice and does not require a signature.", {
          align: "center",
        });

      doc.end();

      stream.on("finish", () => resolve(`/uploads/invoices/${invoiceFileName}`));
      stream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoice };

