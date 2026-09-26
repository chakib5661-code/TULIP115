import { jsPDF } from 'jspdf';
import { PreOrder, StoreSettings } from '../types';

// Format currency in Algerian Dinars (DA)
export const formatDZD = (amount: number): string => {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' DA';
};

// Generate PDF Bon de Précommande
export const generatePreOrderPDF = (
  order: PreOrder,
  store: StoreSettings,
  options?: { hidePrices?: boolean }
): jsPDF => {
  const isPricesHidden = Boolean(options?.hidePrices);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header background banner (Dark Charcoal / Bronze aesthetic)
  doc.setFillColor(24, 28, 36);
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Green/Amber accent line (Algerian warm tones)
  doc.setFillColor(217, 119, 6); // warm amber
  doc.rect(0, 38, pageWidth, 2.5, 'F');

  // Company Name & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(store.storeName.toUpperCase(), margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(store.tagline, margin, 20);

  // Store contact info in top right
  doc.setFontSize(8);
  doc.text(`Tél: ${store.phone}`, pageWidth - margin, 13, { align: 'right' });
  doc.text(`Wilaya: ${store.wilaya}`, pageWidth - margin, 18, { align: 'right' });
  doc.text(`Adresse: ${store.address}`, pageWidth - margin, 23, { align: 'right' });
  doc.text(`Email: ${store.email}`, pageWidth - margin, 28, { align: 'right' });

  // Document Title Badge
  let y = 50;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 16, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const isProforma = order.orderNumber.startsWith('PRO-');
  doc.text(
    isProforma
      ? 'FACTURE PROFORMA / DEVIS ESTIMATIF'
      : 'BON DE PRÉCOMMANDE / RÉSERVATION DE STOCK',
    margin + 6,
    y + 7
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Réf: ${order.orderNumber}`, margin + 6, y + 12.5);

  const formattedDate = new Date(order.date).toLocaleString('fr-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Date: ${formattedDate}`, pageWidth - margin - 6, y + 12.5, { align: 'right' });

  // Two columns info block: Client Details (Left) & Delivery Mode (Right)
  y = 72;
  const colWidth = (pageWidth - (margin * 2) - 8) / 2;

  // Box 1: Client
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, colWidth, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('COORDONNÉES DU CLIENT', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const clientName = order.customer.fullName + (order.customer.companyName ? ` (${order.customer.companyName})` : '');
  doc.text(`Nom / Client : ${clientName}`, margin + 4, y + 13);
  doc.text(`Téléphone : ${order.customer.phone}`, margin + 4, y + 19);
  if (order.customer.secondaryPhone) {
    doc.text(`Tél 2 : ${order.customer.secondaryPhone}`, margin + 4, y + 25);
  } else {
    doc.text(`Wilaya : ${order.customer.wilayaCode} - ${order.customer.wilayaName}`, margin + 4, y + 25);
  }
  doc.text(`Commune : ${order.customer.commune || 'Centre'}`, margin + 4, y + 31);

  // Box 2: Delivery & Payment Details
  const col2X = margin + colWidth + 8;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col2X, y, colWidth, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('LIVRAISON & VALIDATION', col2X + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  let modeText = 'Livraison à Domicile';
  if (order.customer.deliveryMode === 'stop_desk') modeText = 'Bureau Stop-Desk (Yalidine/Express)';
  if (order.customer.deliveryMode === 'magasin') modeText = 'Retrait Direct au Magasin (0 DA)';

  doc.text(`Mode : ${modeText}`, col2X + 4, y + 13);
  doc.text(`Destination : ${order.customer.wilayaName} (${order.customer.wilayaCode})`, col2X + 4, y + 19);
  doc.text(`Paiement : À la livraison / Réception`, col2X + 4, y + 25);

  const shortAddress = order.customer.deliveryAddress ? order.customer.deliveryAddress.slice(0, 35) : 'Adresse spécifiée par téléphone';
  doc.text(`Adresse : ${shortAddress}`, col2X + 4, y + 31);

  // Table of Products
  y = 118;

  // Table header
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, pageWidth - (margin * 2), 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  doc.text('Réf.', margin + 3, y + 5.5);
  doc.text('Désignation de la Matière Première', margin + 28, y + 5.5);
  doc.text('Famille', margin + 98, y + 5.5);
  doc.text('Unité', margin + 118, y + 5.5);
  doc.text('Qté', margin + 136, y + 5.5, { align: 'right' });
  if (isPricesHidden) {
    doc.text('Tarif P.U', margin + 158, y + 5.5, { align: 'right' });
    doc.text('Montant', pageWidth - margin - 4, y + 5.5, { align: 'right' });
  } else {
    doc.text('P.U (DA)', margin + 158, y + 5.5, { align: 'right' });
    doc.text('Total (DA)', pageWidth - margin - 4, y + 5.5, { align: 'right' });
  }

  y += 8;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  order.items.forEach((item, index) => {
    // Alternating zebra row
    if (index % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 250, 252);
    }
    doc.rect(margin, y, pageWidth - (margin * 2), 7.5, 'F');

    // Horizontal line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 7.5, pageWidth - margin, y + 7.5);

    doc.setTextColor(71, 85, 105);
    doc.text(item.code.slice(0, 12), margin + 3, y + 5);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(item.name.slice(0, 36), margin + 28, y + 5);
    doc.setFont('helvetica', 'normal');

    // Family badge text
    if (item.family === 'Extrait') {
      doc.setTextColor(180, 83, 9);
    } else if (item.family === 'Accessoire') {
      doc.setTextColor(13, 148, 136);
    } else {
      doc.setTextColor(30, 64, 175);
    }
    doc.text(item.family, margin + 98, y + 5);

    doc.setTextColor(100, 116, 139);
    const unitText = item.family === 'Extrait' ? '1g (100g)' : item.unit;
    doc.text(unitText, margin + 118, y + 5);

    doc.setTextColor(15, 23, 42);
    const qtyText = item.family === 'Extrait' ? `${item.quantity} g` : item.quantity.toString();
    doc.text(qtyText, margin + 136, y + 5, { align: 'right' });

    if (isPricesHidden) {
      doc.setTextColor(180, 83, 9);
      doc.text('Sur Devis', margin + 158, y + 5, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.text('Proforma', pageWidth - margin - 4, y + 5, { align: 'right' });
      doc.setFont('helvetica', 'normal');
    } else {
      const priceText = item.family === 'Extrait' ? `${item.priceDA} DA/g` : formatDZD(item.priceDA);
      doc.text(priceText, margin + 158, y + 5, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.text(formatDZD(item.totalDA), pageWidth - margin - 4, y + 5, { align: 'right' });
      doc.setFont('helvetica', 'normal');
    }

    y += 7.5;
  });

  // Total calculation box
  y += 5;
  const totalBoxWidth = isPricesHidden ? 95 : 80;
  const totalBoxX = pageWidth - margin - totalBoxWidth;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(totalBoxX, y, totalBoxWidth, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Articles commandés :', totalBoxX + 5, y + 7);
  doc.text(`${order.items.reduce((s, i) => s + i.quantity, 0)} unités`, totalBoxX + totalBoxWidth - 5, y + 7, { align: 'right' });

  doc.setDrawColor(203, 213, 225);
  doc.line(totalBoxX + 5, y + 10, totalBoxX + totalBoxWidth - 5, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(isPricesHidden ? 'STATUT TARIF :' : 'TOTAL PRÉCOMMANDE :', totalBoxX + 5, y + 17);

  if (isPricesHidden) {
    doc.setTextColor(180, 83, 9); // Amber gold
    doc.setFontSize(8.5);
    doc.text('Sur Devis Proforma', totalBoxX + totalBoxWidth - 5, y + 17, { align: 'right' });
  } else {
    doc.setTextColor(180, 83, 9); // Amber gold
    doc.text(formatDZD(order.totalDA), totalBoxX + totalBoxWidth - 5, y + 17, { align: 'right' });
  }

  // Client notes if any
  if (order.customer.notes) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Note client: "${order.customer.notes.slice(0, 80)}"`, margin, y + 8);
  }

  // Terms and stamp footer
  const footerY = pageHeight - 45;

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('CONDITIONS & RÉSERVATION DE STOCK :', margin, footerY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('• Les matières premières figurant sur ce bon sont réservées pour une durée de 48 heures.', margin, footerY + 11);
  doc.text('• Notre service commercial vous appellera pour confirmer la disponibilité et planifier l\'expédition.', margin, footerY + 16);
  doc.text('• Règlement en espèces à la livraison ou au comptoir du magasin.', margin, footerY + 21);

  // Stamp / signature box
  const stampBoxX = pageWidth - margin - 55;
  doc.setDrawColor(203, 213, 225);
  doc.rect(stampBoxX, footerY + 4, 55, 24);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Cachet et Signature Magasin', stampBoxX + 27.5, footerY + 9, { align: 'center' });

  // Bottom copyright
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`${store.storeName} — Catalogue et Gestion des Matières Premières en Algérie — ${store.phone}`, pageWidth / 2, pageHeight - 6, { align: 'center' });

  return doc;
};

// Direct download helper
export const downloadOrderPDF = (
  order: PreOrder,
  store: StoreSettings,
  options?: { hidePrices?: boolean }
) => {
  const doc = generatePreOrderPDF(order, store, options);
  doc.save(`Bon_Precommande_${order.orderNumber}.pdf`);
};

// Print directly via browser helper
export const printOrderPDF = (
  order: PreOrder,
  store: StoreSettings,
  options?: { hidePrices?: boolean }
) => {
  const doc = generatePreOrderPDF(order, store, options);
  const blobUrl = doc.output('bloburl');
  const printWindow = window.open(blobUrl);
  if (printWindow) {
    printWindow.focus();
  }
};
