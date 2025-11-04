const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

/**
 * Generate a beautiful invoice PDF
 * @param {Object} data - Invoice data
 * @returns {Promise<string>} invoicePath
 */
exports.generateInvoice = (data) => {
  return new Promise((resolve, reject) => {
    try {
      // Create uploads/invoices directory if not exist
      const invoiceDir = path.join(__dirname, "../uploads/invoices");
      if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir, { recursive: true });

      // File name and path
      const fileName = `invoice_${data.order_number || Date.now()}.pdf`;
      const filePath = path.join(invoiceDir, fileName);

      // Create a new PDF document
      const doc = new PDFDocument({ margin: 50 });

      // Pipe to file
      doc.pipe(fs.createWriteStream(filePath));

      // =============== HEADER ===============
      doc
        .fillColor("#2C3E50")
        .fontSize(22)
        .text("INVOICE", { align: "right" })
        .moveDown(0.5);

      // Add company logo (optional)
      const logoPath = path.join(__dirname, "../uploads/logo.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 40, { width: 80 });
      }

      doc
        .fontSize(10)
        .fillColor("#555555")
        .text("FitLife Pvt. Ltd.", 50, 110)
        .text("123 Wellness Street", 50, 125)
        .text("Mumbai, India", 50, 140)
        .moveDown();

      // =============== CUSTOMER & ORDER INFO ===============
      doc
        .fillColor("#000")
        .fontSize(12)
        .text(`Invoice No: ${data.order_number}`, 400, 110)
        .text(`Date: ${new Date(data.order_date).toLocaleDateString()}`, 400, 125)
        .moveDown();

      doc.moveDown(1);

      doc
        .fontSize(12)
        .fillColor("#2C3E50")
        .text("Bill To:", 50)
        .fillColor("#000")
        .text(`${data.customer_name || "Customer"}`)
        .text(`${data.customer_address || ""}`)
        .moveDown(1);

      doc
        .fontSize(12)
        .fillColor("#2C3E50")
        .text("Vendor:", 300)
        .fillColor("#000")
        .text(`${data.vendor_name || "Vendor"}`)
        .text(`${data.vendor_phone || ""}`)
        .moveDown(2);

      // =============== TABLE HEADER ===============
      doc
        .fontSize(12)
        .fillColor("#ffffff")
        .rect(50, doc.y, 500, 20)
        .fill("#34495E");

      const headerY = doc.y - 15;
      doc
        .fillColor("#fff")
        .text("Item", 60, headerY)
        .text("Qty", 280, headerY)
        .text("Price", 340, headerY)
        .text("Total", 430, headerY);

      doc.moveDown(1);

      // =============== TABLE ROWS ===============
      doc.fillColor("#000");
      let totalAmount = 0;

      data.items.forEach((item, index) => {
        const y = doc.y + 10;
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;

        doc
          .fontSize(10)
          .text(`${index + 1}. ${item.product_name}`, 60, y)
          .text(item.quantity, 290, y)
          .text(`₹${item.price}`, 350, y)
          .text(`₹${itemTotal}`, 430, y);

        doc.moveDown(0.5);
      });

      doc.moveDown(1);

      // =============== TOTAL ===============
      doc
        .fontSize(12)
        .fillColor("#000")
        .text("Subtotal:", 400, doc.y)
        .text(`₹${totalAmount.toFixed(2)}`, 470, doc.y, { align: "right" });

      const tax = totalAmount * 0.18;
      const grandTotal = totalAmount + tax;

      doc
        .text("GST (18%):", 400, doc.y + 15)
        .text(`₹${tax.toFixed(2)}`, 470, doc.y + 15, { align: "right" });

      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .text("Grand Total:", 400, doc.y + 30)
        .text(`₹${grandTotal.toFixed(2)}`, 470, doc.y + 30, { align: "right" });

      doc.moveDown(2);

      // =============== FOOTER ===============
      doc
        .moveDown(2)
        .fontSize(10)
        .fillColor("#7f8c8d")
        .text("Thank you for shopping with us!", { align: "center" })
        .text("For support contact: ", { align: "center" });

      // End PDF
      doc.end();

      doc.on("finish", () => {
        resolve(`/uploads/invoices/${fileName}`);
      });
    } catch (err) {
      reject(err);
    }
  });
};
