const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateInvoice = async (orderData) => {
  return new Promise((resolve, reject) => {
    try {
      const invoiceDir = path.join(__dirname, '../uploads/invoices');
      if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir, { recursive: true });

      const invoiceFileName = `invoice_${orderData.order_number || Date.now()}.pdf`;
      const filePath = path.join(invoiceDir, invoiceFileName);

      const doc = new PDFDocument({ margin: 50 });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // HEADER
      doc.fontSize(22).text("INVOICE", { align: "center" });
      doc.moveDown(1);

      // Order Info
      doc.fontSize(12)
        .text(`Invoice Number: ${orderData.order_number}`)
        .text(`Date: ${new Date(orderData.order_date).toLocaleDateString()}`)
        .text(`Customer: ${orderData.customer_name}`)
        .text(`Vendor: ${orderData.vendor_name}`)
        .moveDown();

      // ITEMS TABLE
      doc.fontSize(14).text("Items", { underline: true });
      doc.moveDown(0.5);

      orderData.items.forEach((item, index) => {
        doc.fontSize(12)
          .text(`${index + 1}. ${item.product_name}`)
          .text(`   Qty: ${item.quantity} | Price: ₹${item.price}`)
          .moveDown(0.2);
      });

      doc.moveDown(1);
      doc.fontSize(14).text(`Total Amount: ₹${orderData.total}`, { align: 'right' });

      // FOOTER
      doc.moveDown(2);
      doc.fontSize(10).text("Thank you for shopping with us!", { align: "center" });

      doc.end();

      stream.on('finish', () => resolve(`/uploads/invoices/${invoiceFileName}`));
      stream.on('error', (err) => reject(err));

    } catch (err) {
      reject(err);
    }
  });
};


module.exports = { generateInvoice };
