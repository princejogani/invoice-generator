const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const generateInvoicePDF = (invoice, res, user) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    // Load font for Rupee symbol support if available
    try {
        doc.registerFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf');
        doc.font('DejaVuSans');
    } catch (e) {
        console.warn('DejaVuSans font not found, falling back to Helvetica');
    }

    doc.pipe(res);

    renderProfessionalLayout(doc, invoice, user);

    doc.end();
};

const generateInvoicePDFBuffer = (invoice, user) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });

        try {
            doc.registerFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf');
            doc.font('DejaVuSans');
        } catch (e) {
            console.warn('DejaVuSans font not found, falling back to Helvetica');
        }

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });
        doc.on('error', reject);

        renderProfessionalLayout(doc, invoice, user);

        doc.end();
    });
};

// Main shared rendering logic for professional layout
const renderProfessionalLayout = (doc, invoice, user) => {
    const primaryColor = '#1e293b'; // Slate 800
    const secondaryColor = '#64748b'; // Slate 500
    const borderColor = '#e2e8f0'; // Slate 200

    // --- Header ---
    let headerTextX = 40;
    if (user?.logo) {
        try {
            if (user.logo.startsWith('data:image/')) {
                // Base64 logo
                const logoBuffer = Buffer.from(user.logo.split(',')[1], 'base64');
                doc.image(logoBuffer, 40, 40, { width: 60 });
                headerTextX = 115;
            } else if (user.logo.includes('/uploads/')) {
                // Extract relative path from URL
                const relativePath = user.logo.split('/uploads/')[1];
                const fullPath = path.join(__dirname, '..', 'uploads', relativePath);

                if (fs.existsSync(fullPath)) {
                    doc.image(fullPath, 40, 40, { width: 60 });
                    headerTextX = 115;
                }
            }
        } catch (e) {
            console.warn('Failed to render logo:', e.message);
        }
    }

    doc.fillColor(primaryColor).fontSize(22).text(user?.businessName || 'INVOICE', headerTextX, 40, { bold: true });

    if (user?.tagline) {
        doc.fontSize(10).fillColor(secondaryColor).text(user.tagline, headerTextX, 65, { italic: true });
    }

    // Invoice Details (Top Right)
    const topDetailX = 400;
    doc.fillColor(primaryColor).fontSize(10).text('INVOICE DETAILS', topDetailX, 40, { bold: true });

    doc.fontSize(9).fillColor(secondaryColor);
    doc.text(`Invoice No:`, topDetailX, 60).fillColor(primaryColor).text(`#${invoice._id.toString().slice(-6).toUpperCase()}`, topDetailX + 65, 60, { bold: true });

    doc.fillColor(secondaryColor).text(`Date:`, topDetailX, 75).fillColor(primaryColor).text(new Date(invoice.createdAt).toLocaleDateString('en-IN'), topDetailX + 65, 75);

    doc.fillColor(secondaryColor).text(`Type:`, topDetailX, 90).fillColor(primaryColor).text(invoice.type.toUpperCase(), topDetailX + 65, 90);

    doc.moveTo(40, 115).lineTo(555, 115).stroke(borderColor);

    // --- Info Sections (Bill From / To) ---
    const infoTop = 135;

    // Bill From
    doc.fillColor(secondaryColor).fontSize(9).text('BILL FROM', 40, infoTop, { bold: true });
    doc.fillColor(primaryColor).fontSize(12).text(user?.businessName || 'N/A', 40, infoTop + 15, { bold: true });

    const fromAddress = (user?.businessAddress || '').split(',').map(s => s.trim()).filter(Boolean).join('\n');
    doc.fontSize(9).fillColor(secondaryColor).text(fromAddress, 40, infoTop + 35, { width: 220 });

    const addressHeight = doc.heightOfString(fromAddress, { width: 220 });
    const detailsTop = infoTop + 35 + addressHeight + 8;

    doc.fillColor(primaryColor).fontSize(9).text(`GSTIN: ${user?.gstin || 'N/A'}`, 40, detailsTop);
    doc.text(`Phone: ${user?.businessPhone || 'N/A'}`, 40, detailsTop + 14);

    // Bill To
    doc.fillColor(secondaryColor).fontSize(9).text('BILL TO', 320, infoTop, { bold: true });
    doc.fillColor(primaryColor).fontSize(12).text(invoice.customerName, 320, infoTop + 15, { bold: true });
    doc.fontSize(9).fillColor(secondaryColor).text(`Phone: ${invoice.customerPhone}`, 320, infoTop + 35);

    // --- Items Table ---
    const tableTop = 260;

    // Header
    doc.rect(40, tableTop, 515, 25).fill('#f8fafc').stroke(borderColor);
    doc.fillColor(primaryColor).fontSize(10).text('Item Description', 50, tableTop + 8, { bold: true });
    doc.text('Qty', 320, tableTop + 8, { bold: true, width: 40, align: 'center' });
    doc.text('Unit Price', 380, tableTop + 8, { bold: true, width: 80, align: 'right' });
    doc.text('Total', 475, tableTop + 8, { bold: true, width: 70, align: 'right' });

    // Rows
    let y = tableTop + 35;
    invoice.items.forEach((item, index) => {
        if (index % 2 === 1) {
            doc.rect(40, y - 5, 515, 25).fill('#fcfdfe');
        }

        doc.fillColor(primaryColor).fontSize(9)
            .text(item.name, 50, y, { width: 250 })
            .text(item.qty.toString(), 320, y, { width: 40, align: 'center' })
            .text(`₹${item.price.toLocaleString()}`, 380, y, { width: 80, align: 'right' })
            .text(`₹${(item.qty * item.price).toLocaleString()}`, 475, y, { width: 70, align: 'right' });

        y += 25;

        // Prevent overflow (very basic check)
        if (y > 700) {
            doc.addPage();
            y = 50;
        }
    });

    // --- Financial Summary ---
    doc.moveTo(40, y + 5).lineTo(555, y + 5).stroke(borderColor);

    const summaryX = 350;
    let summaryY = y + 20;

    const renderRow = (label, value, isBold = false, color = primaryColor) => {
        doc.fillColor(secondaryColor).fontSize(10).text(label, summaryX, summaryY);
        doc.fillColor(color).text(value, summaryX + 110, summaryY, { align: 'right', width: 95, bold: isBold });
        summaryY += 20;
    };

    renderRow('Subtotal', `₹${invoice.subtotal.toLocaleString()}`);

    if (invoice.type === 'GST' || invoice.type === 'gst') {
        renderRow(`GST (${invoice.gstPercentage || 18}%)`, `₹${invoice.gst.toLocaleString()}`);
    }

    // Handle multiple adjustments
    let totalAdjustments = 0;

    // First, check for new adjustments array
    if (invoice.adjustments && invoice.adjustments.length > 0) {
        invoice.adjustments.forEach(adj => {
            let amount = 0;
            if (adj.type === 'percent') {
                amount = (invoice.subtotal * adj.value) / 100;
            } else {
                amount = adj.value;
            }

            const adjAmount = adj.operation === 'subtract' ? -amount : amount;
            totalAdjustments += adjAmount;

            const adjLabel = adj.type === 'percent' ? `${adj.label} (${adj.value}%)` : adj.label;
            const displayAmount = adj.operation === 'subtract' ? -amount : amount;
            renderRow(adjLabel, `${displayAmount >= 0 ? '' : '-'}₹${Math.abs(displayAmount).toLocaleString()}`, false, primaryColor);
        });
    }
    // Backward compatibility: check for old adjustment object
    else if (invoice.adjustment && invoice.adjustment.value !== 0) {
        const isPercent = invoice.adjustment.type === 'percent';
        const adjAmt = isPercent ? (invoice.subtotal * invoice.adjustment.value / 100) : invoice.adjustment.value;
        const adjLabel = isPercent ? `Adjustment (${invoice.adjustment.value}%)` : 'Adjustment';
        totalAdjustments = adjAmt;
        renderRow(adjLabel, `${adjAmt >= 0 ? '' : '-'}₹${Math.abs(adjAmt).toLocaleString()}`, false, primaryColor);
    }

    // Grand Total Box
    summaryY += 5;
    doc.rect(summaryX - 10, summaryY, 215, 35).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(14).text('TOTAL AMOUNT', summaryX, summaryY + 12, { bold: true });
    doc.text(`₹${invoice.finalAmount.toLocaleString()}`, summaryX + 110, summaryY + 12, { bold: true, align: 'right', width: 95 });
};

module.exports = { generateInvoicePDF, generateInvoicePDFBuffer };
