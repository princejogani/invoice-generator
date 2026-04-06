const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Map CSS font-family strings to PDFKit built-in font names
const mapFont = (fontFamily, bold = false) => {
    const f = (fontFamily || '').toLowerCase();
    if (f.includes('times') || f.includes('georgia') || f.includes('serif')) {
        return bold ? 'Times-Bold' : 'Times-Roman';
    }
    if (f.includes('courier')) {
        return bold ? 'Courier-Bold' : 'Courier';
    }
    // Helvetica, Arial, Verdana, Tahoma, sans-serif → Helvetica
    return bold ? 'Helvetica-Bold' : 'Helvetica';
};

const generateInvoicePDF = (invoice, res, user) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    doc.pipe(res);
    renderCustomLayout(doc, invoice, user);
    doc.end();
};

const generateInvoicePDFBuffer = (invoice, user) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 0, size: 'A4' });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);
        renderCustomLayout(doc, invoice, user);
        doc.end();
    });
};

// Modern layout with clean design, rounded corners, and gradients
const renderModernLayout = (doc, invoice, user) => {
    const primaryColor = '#4f46e5'; // Indigo 600
    const secondaryColor = '#6b7280'; // Gray 500
    const accentColor = '#8b5cf6'; // Violet 500
    const borderColor = '#e5e7eb'; // Gray 200
    const lightBg = '#f9fafb'; // Gray 50

    // --- Header with gradient background ---
    doc.rect(40, 30, 515, 70).fill('#f8fafc').stroke(borderColor);
    doc.roundedRect(40, 30, 515, 70, 8).fill('#ffffff').stroke(borderColor);

    let headerTextX = 40;
    if (user?.logo) {
        try {
            if (user.logo.startsWith('data:image/')) {
                const logoBuffer = Buffer.from(user.logo.split(',')[1], 'base64');
                doc.image(logoBuffer, 50, 45, { width: 50 });
                headerTextX = 115;
            } else if (user.logo.includes('/uploads/')) {
                const relativePath = user.logo.split('/uploads/')[1];
                const fullPath = path.join(__dirname, '..', 'uploads', relativePath);
                if (fs.existsSync(fullPath)) {
                    doc.image(fullPath, 50, 45, { width: 50 });
                    headerTextX = 115;
                }
            }
        } catch (e) {
            console.warn('Failed to render logo:', e.message);
        }
    }

    doc.fillColor(primaryColor).fontSize(24).text(user?.businessName || 'INVOICE', headerTextX, 45, { bold: true });

    if (user?.tagline) {
        doc.fontSize(11).fillColor(secondaryColor).text(user.tagline, headerTextX, 75, { italic: true });
    }

    // Invoice Details (Top Right with badge style)
    const topDetailX = 400;
    doc.fillColor('#ffffff').fontSize(10).text('INVOICE', topDetailX, 40, { bold: true });
    doc.roundedRect(topDetailX - 5, 38, 100, 20, 4).fill(primaryColor);

    doc.fillColor('#ffffff').fontSize(9);
    doc.text(`#${invoice._id.toString().slice(-6).toUpperCase()}`, topDetailX + 10, 55, { bold: true });

    doc.fillColor(secondaryColor).fontSize(9);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, topDetailX, 75);
    doc.text(`Type: ${invoice.type.toUpperCase()}`, topDetailX, 90);

    doc.moveTo(40, 115).lineTo(555, 115).stroke(borderColor);

    // --- Info Sections (Bill From / To) with cards ---
    const infoTop = 135;

    // Bill From card
    doc.roundedRect(40, infoTop, 250, 120, 6).fill('#ffffff').stroke(borderColor);
    doc.fillColor(primaryColor).fontSize(10).text('BILL FROM', 55, infoTop + 15, { bold: true });
    doc.fillColor('#111827').fontSize(13).text(user?.businessName || 'N/A', 55, infoTop + 35, { bold: true });

    const fromAddress = (user?.businessAddress || '').split(',').map(s => s.trim()).filter(Boolean).join('\n');
    doc.fontSize(9).fillColor(secondaryColor).text(fromAddress, 55, infoTop + 55, { width: 220 });

    const addressHeight = doc.heightOfString(fromAddress, { width: 220 });
    const detailsTop = infoTop + 55 + addressHeight + 8;

    doc.fillColor(primaryColor).fontSize(9).text(`GSTIN: ${user?.gstin || 'N/A'}`, 55, detailsTop);
    doc.text(`Phone: ${user?.businessPhone || 'N/A'}`, 55, detailsTop + 14);

    // Bill To card
    doc.roundedRect(320, infoTop, 235, 120, 6).fill('#ffffff').stroke(borderColor);
    doc.fillColor(primaryColor).fontSize(10).text('BILL TO', 335, infoTop + 15, { bold: true });
    doc.fillColor('#111827').fontSize(13).text(invoice.customerName, 335, infoTop + 35, { bold: true });
    doc.fontSize(9).fillColor(secondaryColor).text(`Phone: ${invoice.customerPhone}`, 335, infoTop + 55);

    // --- Items Table with rounded header ---
    const tableTop = 280;

    // Table header with rounded corners
    doc.roundedRect(40, tableTop, 515, 30, 4).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(11).text('Item Description', 50, tableTop + 10, { bold: true });
    doc.text('Qty', 320, tableTop + 10, { bold: true, width: 40, align: 'center' });
    doc.text('Unit Price', 380, tableTop + 10, { bold: true, width: 80, align: 'right' });
    doc.text('Total', 475, tableTop + 10, { bold: true, width: 70, align: 'right' });

    // Rows with alternating background
    let y = tableTop + 40;
    invoice.items.forEach((item, index) => {
        if (index % 2 === 0) {
            doc.roundedRect(40, y - 10, 515, 30, 2).fill(lightBg);
        }

        doc.fillColor('#111827').fontSize(10)
            .text(item.name, 50, y, { width: 250 })
            .text(item.qty.toString(), 320, y, { width: 40, align: 'center' })
            .text(`₹${item.price.toLocaleString()}`, 380, y, { width: 80, align: 'right' })
            .text(`₹${(item.qty * item.price).toLocaleString()}`, 475, y, { width: 70, align: 'right' });

        y += 30;

        if (y > 700) {
            doc.addPage();
            y = 50;
        }
    });

    // --- Financial Summary with modern styling ---
    doc.moveTo(40, y + 10).lineTo(555, y + 10).stroke(borderColor);

    const summaryX = 350;
    let summaryY = y + 30;

    const renderRow = (label, value, isBold = false, color = primaryColor) => {
        doc.fillColor(secondaryColor).fontSize(10).text(label, summaryX, summaryY);
        doc.fillColor(color).text(value, summaryX + 110, summaryY, { align: 'right', width: 95, bold: isBold });
        summaryY += 22;
    };

    renderRow('Subtotal', `₹${invoice.subtotal.toLocaleString()}`);

    if (invoice.type === 'GST' || invoice.type === 'gst') {
        renderRow(`GST (${invoice.gstPercentage || 18}%)`, `₹${invoice.gst.toLocaleString()}`);
    }

    // Handle adjustments
    let totalAdjustments = 0;
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
    } else if (invoice.adjustment && invoice.adjustment.value !== 0) {
        const isPercent = invoice.adjustment.type === 'percent';
        const adjAmt = isPercent ? (invoice.subtotal * invoice.adjustment.value / 100) : invoice.adjustment.value;
        const adjLabel = isPercent ? `Adjustment (${invoice.adjustment.value}%)` : 'Adjustment';
        totalAdjustments = adjAmt;
        renderRow(adjLabel, `${adjAmt >= 0 ? '' : '-'}₹${Math.abs(adjAmt).toLocaleString()}`, false, primaryColor);
    }

    // Grand Total with accent color
    summaryY += 10;
    doc.roundedRect(summaryX - 10, summaryY, 215, 40, 6).fill(accentColor);
    doc.fillColor('#ffffff').fontSize(14).text('TOTAL AMOUNT', summaryX, summaryY + 13, { bold: true });
    doc.text(`₹${invoice.finalAmount.toLocaleString()}`, summaryX + 110, summaryY + 13, { bold: true, align: 'right', width: 95 });
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

// Customizable layout using user's invoiceCustomizations
const renderCustomLayout = (doc, invoice, user) => {
    const C = { ...{
        primaryColor: '#1e293b', secondaryColor: '#64748b', accentColor: '#3b82f6',
        backgroundColor: '#ffffff', borderColor: '#e2e8f0',
        tableHeaderBg: '#1e293b', tableHeaderColor: '#ffffff',
        cardBg: '#f8fafc', alternateRowBg: '#f1f5f9',
        fontSize: 11, headerFontSize: 24,
        pagePadding: 32, sectionSpacing: 20,
        cellPaddingV: 8, cellPaddingH: 10, columnGap: 16, cardPadding: 12,
        summaryRowPadding: 6, totalPadding: 10,
        logoSize: 60, logoPosition: 'left', logoBorderRadius: 4,
        cardBorderRadius: 6, tableBorderRadius: 6, borderWidth: 1,
        showHeaderBorder: true, showCardBorder: true,
        showRowDividers: true, showAlternateRows: true, showSummaryBorders: true,
        showLogo: true,
        showDueDate: true, showBusinessAddress: true, showGstin: true,
        showCustomerAddress: true, showThankYou: true,
        footerText: 'Payment due within 7 days. Thank you for your business.',
    }, ...(user?.invoiceCustomizations || {}) };

    const P = C.pagePadding;
    const pageW = 595 - P * 2; // usable width
    let y = P;

    // Background
    if (C.backgroundColor !== '#ffffff') {
        doc.rect(0, 0, 595, 842).fill(C.backgroundColor);
    }

    // ── HEADER ──────────────────────────────────────────────────────────────
    const headerStartY = y;
    let logoEndX = P;

    if (user?.logo && C.showLogo !== false) {
        try {
            let logoX = P;
            if (C.logoPosition === 'center') logoX = (595 - C.logoSize) / 2;
            else if (C.logoPosition === 'right') logoX = 595 - P - C.logoSize;

            if (user.logo.startsWith('data:image/')) {
                doc.image(Buffer.from(user.logo.split(',')[1], 'base64'), logoX, y, { width: C.logoSize, height: C.logoSize });
            } else if (user.logo.includes('/uploads/')) {
                const fullPath = path.join(__dirname, '..', 'uploads', user.logo.split('/uploads/')[1]);
                if (fs.existsSync(fullPath)) doc.image(fullPath, logoX, y, { width: C.logoSize, height: C.logoSize });
            }
            if (C.logoPosition === 'left') logoEndX = P + C.logoSize + 12;
        } catch (e) { console.warn('Logo error:', e.message); }
    }

    const bizX = C.logoPosition === 'right' ? P : logoEndX;
    doc.fillColor(C.primaryColor).fontSize(C.headerFontSize).font(mapFont(C.fontFamily, true)).text(user?.businessName || 'Business Name', bizX, y);
    let bizY = y + C.headerFontSize + 4;
    if (user?.tagline) {
        doc.fillColor(C.secondaryColor).fontSize(C.fontSize - 1).font(mapFont(C.fontFamily)).text(user.tagline, bizX, bizY);
        bizY += C.fontSize + 2;
    }
    if (C.showBusinessAddress && user?.businessAddress) {
        doc.fillColor(C.secondaryColor).fontSize(C.fontSize - 1).font(mapFont(C.fontFamily)).text(user.businessAddress, bizX, bizY, { width: 220 });
        bizY += doc.heightOfString(user.businessAddress, { width: 220 }) + 2;
    }
    if (C.showGstin && user?.gstin) {
        doc.fillColor(C.secondaryColor).fontSize(C.fontSize - 1).font(mapFont(C.fontFamily)).text(`GSTIN: ${user.gstin}`, bizX, bizY);
    }

    // Invoice info top-right
    const infoX = 595 - P - 160;
    doc.fillColor(C.primaryColor).fontSize(C.headerFontSize).font(mapFont(C.fontFamily, true)).text('INVOICE', infoX, y, { width: 160, align: 'right' });
    doc.font(mapFont(C.fontFamily)).fillColor(C.secondaryColor).fontSize(C.fontSize)
        .text(`#${invoice._id.toString().slice(-6).toUpperCase()}`, infoX, y + C.headerFontSize + 4, { width: 160, align: 'right' });
    let infoY = y + C.headerFontSize + 4 + C.fontSize + 3;
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, infoX, infoY, { width: 160, align: 'right' });
    if (C.showDueDate) {
        const due = new Date(invoice.createdAt);
        due.setDate(due.getDate() + 7);
        doc.text(`Due: ${due.toLocaleDateString('en-IN')}`, infoX, infoY + C.fontSize + 2, { width: 160, align: 'right' });
    }

    y = Math.max(bizY, y + C.logoSize) + C.sectionSpacing;

    if (C.showHeaderBorder) {
        doc.moveTo(P, y - C.sectionSpacing / 2).lineTo(595 - P, y - C.sectionSpacing / 2)
            .lineWidth(C.borderWidth).stroke(C.borderColor);
    }

    // ── BILL FROM / BILL TO ──────────────────────────────────────────────────
    const colW = (pageW - C.columnGap) / 2;
    const cards = [
        { title: 'BILL FROM', name: user?.businessName || 'N/A', phone: user?.businessPhone || '', addr: C.showBusinessAddress ? user?.businessAddress : null },
        { title: 'BILL TO', name: invoice.customerName, phone: invoice.customerPhone, addr: C.showCustomerAddress ? invoice.customerAddress : null },
    ];
    // Dynamic card height based on fontSize and cardPadding
    const cardLineH = C.fontSize + 3;
    const cardH = C.cardPadding * 2 + cardLineH * 4;
    const cr = Math.max(0, C.cardBorderRadius);
    cards.forEach((card, i) => {
        const cx = P + i * (colW + C.columnGap);
        if (cr > 0) {
            doc.roundedRect(cx, y, colW, cardH, cr).fill(C.cardBg);
            if (C.showCardBorder) doc.roundedRect(cx, y, colW, cardH, cr).lineWidth(C.borderWidth).stroke(C.borderColor);
        } else {
            doc.rect(cx, y, colW, cardH).fill(C.cardBg);
            if (C.showCardBorder) doc.rect(cx, y, colW, cardH).lineWidth(C.borderWidth).stroke(C.borderColor);
        }
        doc.fillColor(C.accentColor).fontSize(C.fontSize - 1).font(mapFont(C.fontFamily, true))
            .text(card.title, cx + C.cardPadding, y + C.cardPadding);
        doc.fillColor(C.primaryColor).fontSize(C.fontSize + 1).font(mapFont(C.fontFamily, true))
            .text(card.name, cx + C.cardPadding, y + C.cardPadding + cardLineH);
        doc.fillColor(C.secondaryColor).fontSize(C.fontSize - 1).font(mapFont(C.fontFamily))
            .text(card.phone, cx + C.cardPadding, y + C.cardPadding + cardLineH * 2);
        if (card.addr) {
            doc.text(card.addr, cx + C.cardPadding, y + C.cardPadding + cardLineH * 3, { width: colW - C.cardPadding * 2 });
        }
    });
    y += cardH + C.sectionSpacing;

    // ── ITEMS TABLE ──────────────────────────────────────────────────────────
    const rowH = C.cellPaddingV * 2 + C.fontSize + 2;
    const tr = Math.max(0, C.tableBorderRadius);
    // Header row
    if (tr > 0) {
        doc.roundedRect(P, y, pageW, rowH, tr).fill(C.tableHeaderBg);
    } else {
        doc.rect(P, y, pageW, rowH).fill(C.tableHeaderBg);
    }
    doc.fillColor(C.tableHeaderColor).fontSize(C.fontSize).font(mapFont(C.fontFamily, true));
    const cols = [
        { label: '#',           x: P + C.cellPaddingH,       w: 20,  align: 'center' },
        { label: 'Item',        x: P + C.cellPaddingH + 24,  w: pageW * 0.42, align: 'left' },
        { label: 'Qty',         x: P + pageW * 0.58,         w: 40,  align: 'center' },
        { label: 'Unit Price',  x: P + pageW * 0.68,         w: 80,  align: 'right' },
        { label: 'Total',       x: P + pageW * 0.84,         w: pageW * 0.16 - C.cellPaddingH, align: 'right' },
    ];
    cols.forEach(col => doc.text(col.label, col.x, y + C.cellPaddingV, { width: col.w, align: col.align }));
    y += rowH;

    doc.font(mapFont(C.fontFamily));
    invoice.items.forEach((item, idx) => {
        if (y > 750) { doc.addPage(); y = P; }
        if (C.showAlternateRows && idx % 2 === 1) {
            doc.rect(P, y, pageW, rowH).fill(C.alternateRowBg);
        }
        doc.fillColor(C.primaryColor).fontSize(C.fontSize).font(mapFont(C.fontFamily));
        doc.text(String(idx + 1), cols[0].x, y + C.cellPaddingV, { width: cols[0].w, align: 'center' });
        doc.text(item.name, cols[1].x, y + C.cellPaddingV, { width: cols[1].w, align: 'left' });
        doc.text(String(item.qty), cols[2].x, y + C.cellPaddingV, { width: cols[2].w, align: 'center' });
        doc.text(`Rs.${item.price.toLocaleString()}`, cols[3].x, y + C.cellPaddingV, { width: cols[3].w, align: 'right' });
        doc.text(`Rs.${(item.qty * item.price).toLocaleString()}`, cols[4].x, y + C.cellPaddingV, { width: cols[4].w, align: 'right' });
        if (C.showRowDividers) {
            doc.moveTo(P, y + rowH).lineTo(595 - P, y + rowH).lineWidth(0.5).stroke(C.borderColor);
        }
        y += rowH;
    });
    y += C.sectionSpacing;

    // ── SUMMARY ──────────────────────────────────────────────────────────────
    const sumW = 200;
    const sumX = 595 - P - sumW;
    const sumRowH = C.summaryRowPadding * 2 + C.fontSize + 2;

    const drawSumRow = (label, value, last = false) => {
        doc.fillColor(C.secondaryColor).fontSize(C.fontSize).font(mapFont(C.fontFamily)).text(label, sumX, y + C.summaryRowPadding);
        doc.fillColor(C.primaryColor).font(mapFont(C.fontFamily)).text(value, sumX, y + C.summaryRowPadding, { width: sumW, align: 'right' });
        if (C.showSummaryBorders && !last) {
            doc.moveTo(sumX, y + sumRowH).lineTo(sumX + sumW, y + sumRowH).lineWidth(0.5).stroke(C.borderColor);
        }
        y += sumRowH;
    };

    drawSumRow('Subtotal', `Rs.${invoice.subtotal.toLocaleString()}`);
    if (invoice.type === 'GST' || invoice.type === 'gst') {
        drawSumRow(`GST (${invoice.gstPercentage || 18}%)`, `Rs.${invoice.gst.toLocaleString()}`);
    }
    if (invoice.adjustments && invoice.adjustments.length > 0) {
        invoice.adjustments.forEach(adj => {
            const amt = adj.type === 'percent' ? (invoice.subtotal * adj.value) / 100 : adj.value;
            const display = adj.operation === 'subtract' ? -amt : amt;
            const lbl = adj.type === 'percent' ? `${adj.label} (${adj.value}%)` : adj.label;
            drawSumRow(lbl, `${display < 0 ? '-' : ''}Rs.${Math.abs(display).toLocaleString()}`);
        });
    } else if (invoice.adjustment && invoice.adjustment.value !== 0) {
        const amt = invoice.adjustment.type === 'percent' ? (invoice.subtotal * invoice.adjustment.value / 100) : invoice.adjustment.value;
        drawSumRow(invoice.adjustment.type === 'percent' ? `Adjustment (${invoice.adjustment.value}%)` : 'Adjustment',
            `${amt < 0 ? '-' : ''}Rs.${Math.abs(amt).toLocaleString()}`, true);
    }

    // Total box
    const totalBoxH = C.totalPadding * 2 + C.fontSize + 4;
    const tbr = Math.max(0, C.cardBorderRadius);
    if (tbr > 0) {
        doc.roundedRect(sumX, y + 4, sumW, totalBoxH, tbr).fill(C.accentColor);
    } else {
        doc.rect(sumX, y + 4, sumW, totalBoxH).fill(C.accentColor);
    }
    doc.fillColor('#ffffff').fontSize(C.fontSize + 1).font(mapFont(C.fontFamily, true))
        .text('TOTAL', sumX + C.totalPadding, y + 4 + C.totalPadding);
    doc.font(mapFont(C.fontFamily, true)).text(`Rs.${invoice.finalAmount.toLocaleString()}`, sumX, y + 4 + C.totalPadding, { width: sumW - C.totalPadding, align: 'right' });
    y += totalBoxH + 4 + C.sectionSpacing;

    // ── FOOTER ───────────────────────────────────────────────────────────────
    const hasFooter = C.footerText?.trim() || C.showThankYou;
    if (hasFooter) {
        doc.moveTo(P, y).lineTo(595 - P, y).lineWidth(C.borderWidth).stroke(C.borderColor);
        y += C.sectionSpacing / 2;
        if (C.footerText?.trim()) {
            doc.fillColor(C.secondaryColor).fontSize(C.fontSize - 1).font(mapFont(C.fontFamily))
                .text(C.footerText, P, y, { width: pageW, align: 'center' });
            y += C.fontSize + 4;
        }
        if (C.showThankYou) {
            doc.fillColor(C.accentColor).fontSize(C.fontSize).font(mapFont(C.fontFamily, true))
                .text('Thank you for your business!', P, y, { width: pageW, align: 'center' });
        }
    }
};

module.exports = { generateInvoicePDF, generateInvoicePDFBuffer };
