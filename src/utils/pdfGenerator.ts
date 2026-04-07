import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '@/data/invoiceData';

export function generateInvoicePDF(invoice: Invoice) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 58, 138); // dark blue
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Digitalness', 15, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Digital Marketing & IT Solutions', 15, 28);
  doc.text('Hyderabad, Telangana | +91 9550379505', 15, 35);

  // Invoice title
  doc.setFontSize(14);
  doc.text('INVOICE', pageWidth - 15, 20, { align: 'right' });
  doc.setFontSize(10);
  doc.text(invoice.invoiceNumber, pageWidth - 15, 28, { align: 'right' });

  // Reset color
  doc.setTextColor(0, 0, 0);

  // Invoice details
  doc.setFontSize(10);
  const detailsY = 55;

  // Bill To
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 15, detailsY);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.customerName, 15, detailsY + 7);

  // Invoice info
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Date:', pageWidth - 80, detailsY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(invoice.createdDate), pageWidth - 15, detailsY, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Due Date:', pageWidth - 80, detailsY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(invoice.dueDate), pageWidth - 15, detailsY + 7, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Status:', pageWidth - 80, detailsY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.status, pageWidth - 15, detailsY + 14, { align: 'right' });

  // Items Table
  autoTable(doc, {
    startY: detailsY + 25,
    head: [['#', 'Description', 'Qty', 'Rate (₹)', 'Amount (₹)']],
    body: invoice.items.map((item, idx) => [
      (idx + 1).toString(),
      item.description,
      item.quantity.toString(),
      formatCurrency(item.rate),
      formatCurrency(item.amount),
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
  });

  // Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  const summaryX = pageWidth - 80;
  const valueX = pageWidth - 15;

  doc.setFontSize(10);
  doc.text('Subtotal:', summaryX, finalY);
  doc.text(`₹${formatCurrency(invoice.subtotal)}`, valueX, finalY, { align: 'right' });

  doc.text('Tax (18% GST):', summaryX, finalY + 7);
  doc.text(`₹${formatCurrency(invoice.tax)}`, valueX, finalY + 7, { align: 'right' });

  if (invoice.discount > 0) {
    doc.text('Discount:', summaryX, finalY + 14);
    doc.text(`-₹${formatCurrency(invoice.discount)}`, valueX, finalY + 14, { align: 'right' });
  }

  const totalY = finalY + (invoice.discount > 0 ? 24 : 17);
  doc.setFillColor(30, 58, 138);
  doc.rect(summaryX - 5, totalY - 5, pageWidth - summaryX + 5, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', summaryX, totalY + 3);
  doc.text(`₹${formatCurrency(invoice.total)}`, valueX, totalY + 3, { align: 'right' });

  // Paid amount
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (invoice.paidAmount > 0) {
    doc.text('Amount Paid:', summaryX, totalY + 17);
    doc.setTextColor(22, 163, 74);
    doc.text(`₹${formatCurrency(invoice.paidAmount)}`, valueX, totalY + 17, { align: 'right' });
  }

  const balance = invoice.total - invoice.paidAmount;
  if (balance > 0) {
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.text('Balance Due:', summaryX, totalY + 24);
    doc.text(`₹${formatCurrency(balance)}`, valueX, totalY + 24, { align: 'right' });
  }

  // Notes
  if (invoice.notes) {
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Notes:', 15, totalY + 40);
    doc.text(invoice.notes, 15, totalY + 47);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for your business! | Digitalness', pageWidth / 2, footerY, { align: 'center' });
  doc.text('GSTIN: 36AABFK1234A1ZV | PAN: AABFK1234A', pageWidth / 2, footerY + 5, { align: 'center' });

  return doc;
}

export function generateWorkReportPDF(
  customerName: string,
  month: string,
  deliverables: any[],
  summary: { total: number; completed: number; inProgress: number; pending: number; onTimeRate: number }
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Monthly Work Report', 15, 18);
  doc.setFontSize(12);
  doc.text(`${customerName} - ${month}`, 15, 28);
  doc.setFontSize(9);
  doc.text('Digitalness', pageWidth - 15, 18, { align: 'right' });

  doc.setTextColor(0, 0, 0);

  // Summary cards
  const cardY = 50;
  const cardW = 42;
  const cards = [
    { label: 'Total', value: summary.total.toString(), color: [59, 130, 246] },
    { label: 'Completed', value: summary.completed.toString(), color: [22, 163, 74] },
    { label: 'In Progress', value: summary.inProgress.toString(), color: [245, 158, 11] },
    { label: 'Pending', value: summary.pending.toString(), color: [239, 68, 68] },
  ];

  cards.forEach((card, i) => {
    const x = 15 + i * (cardW + 5);
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.roundedRect(x, cardY, cardW, 22, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + cardW / 2, cardY + 12, { align: 'center' });
    doc.setFontSize(8);
    doc.text(card.label, x + cardW / 2, cardY + 18, { align: 'center' });
  });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`On-Time Delivery Rate: ${summary.onTimeRate}%`, 15, cardY + 32);

  // Deliverables Table
  autoTable(doc, {
    startY: cardY + 40,
    head: [['#', 'Deliverable', 'Category', 'Assigned To', 'Due Date', 'Status']],
    body: deliverables.map((d, i) => [
      (i + 1).toString(),
      d.title,
      d.category,
      d.assignedToName || d.assignedTo,
      formatDate(d.dueDate),
      d.status,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 138] },
    styles: { fontSize: 8 },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 5) {
        const status = data.cell.raw;
        if (status === 'Completed') data.cell.styles.textColor = [22, 163, 74];
        else if (status === 'In Progress') data.cell.styles.textColor = [245, 158, 11];
        else if (status === 'Not Started') data.cell.styles.textColor = [239, 68, 68];
        else if (status === 'Review') data.cell.styles.textColor = [59, 130, 246];
      }
    },
  });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')} | Digitalness`, pageWidth / 2, footerY, { align: 'center' });

  return doc;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN').format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
