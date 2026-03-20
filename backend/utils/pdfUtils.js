const PDFDocument = require('pdfkit');

const generateInvoicePDF = (invoice, res) => {
    const doc = new PDFDocument({ margin: 50 });

    // Pipe to response
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('INVOICE', { align: 'right' });
    doc.fontSize(10).text(`Invoice #: ${invoice._id}`, { align: 'right' });
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    // Business Info (Placeholder - can be customized per user)
    doc.fontSize(12).text('Business Name', { underline: true });
    doc.fontSize(10).text('GSTIN: 22AAAAA0000A1Z5');
    doc.moveDown();

    // Customer Info
    doc.text('Bill To:');
    doc.fontSize(12).text(invoice.customerName);
    doc.fontSize(10).text(`Phone: ${invoice.customerPhone}`);
    doc.moveDown();

    // Items Table Header
    const tableTop = 250;
    doc.fontSize(11).text('Item', 50, tableTop);
    doc.text('Qty', 300, tableTop);
    doc.text('Price', 400, tableTop);
    doc.text('Total', 500, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Items
    let i = 0;
    invoice.items.forEach((item) => {
        const y = tableTop + 30 + i * 25;
        doc.text(item.name, 50, y);
        doc.text(item.qty.toString(), 300, y);
        doc.text(item.price.toFixed(2), 400, y);
        doc.text((item.qty * item.price).toFixed(2), 500, y);
        i++;
    });

    const footerTop = tableTop + 50 + i * 25;
    doc.moveTo(50, footerTop).lineTo(550, footerTop).stroke();

    // Totals
    doc.text('Subtotal:', 400, footerTop + 20);
    doc.text(invoice.subtotal.toFixed(2), 500, footerTop + 20);

    if (invoice.type === 'gst') {
        doc.text('GST (18%):', 400, footerTop + 40);
        doc.text(invoice.gst.toFixed(2), 500, footerTop + 40);
    }

    doc.fontSize(14).text('Total Amount:', 400, footerTop + 70);
    doc.text(`INR ${invoice.finalAmount.toFixed(2)}`, 500, footerTop + 70);

    // Footer
    doc.fontSize(10).text('Thank you for your business!', 50, 700, { align: 'center', width: 500 });

    doc.end();
};

module.exports = { generateInvoicePDF };
