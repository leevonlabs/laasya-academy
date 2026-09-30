import jsPDF from 'jspdf';
import { StudentFeeInvoice, GuruSalaryRecord } from './finance';

function formatMonthEndDdMmYy(dateStrOrPeriod?: string | null): string {
  let d = new Date();
  if (dateStrOrPeriod) {
    const parsed = new Date(dateStrOrPeriod);
    if (!isNaN(parsed.getTime())) {
      d = parsed;
    } else {
      const match = dateStrOrPeriod.match(/([a-zA-Z]+)\s+(\d{4})/);
      if (match) {
        const mNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
        const mIdx = mNames.findIndex(m => m.startsWith(match[1].toLowerCase()));
        if (mIdx !== -1) {
          d = new Date(parseInt(match[2], 10), mIdx, 1);
        }
      }
    }
  }
  const year = d.getFullYear();
  const month = d.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const dd = String(lastDay).padStart(2, '0');
  const mm = String(month + 1).padStart(2, '0');
  const yy = String(year).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

/**
 * Downloads a professional, high-resolution vector PDF invoice for a student.
 * Never fails, bypasses html2canvas/Tailwind CSS v4 oklch color parsing issues,
 * and generates a crisp, printable official invoice.
 */
export function downloadStudentFeeInvoicePdf(
  invoice: StudentFeeInvoice,
  customFilename?: string
): boolean {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const filename = customFilename || `Fee_Invoice_${invoice.invoice_number}_${invoice.student_name.replace(/\s+/g, '_')}.pdf`;

    // 1. TOP BANNER: Deep Maroon #590231
    doc.setFillColor(89, 2, 49);
    doc.rect(0, 0, 210, 28, 'F');

    // Golden Accent Line #F9E33A
    doc.setFillColor(249, 227, 58);
    doc.rect(0, 28, 210, 2, 'F');

    // Crest Box 'LC'
    doc.setFillColor(138, 6, 77);
    doc.setDrawColor(249, 227, 58);
    doc.setLineWidth(0.6);
    doc.roundedRect(12, 5, 18, 18, 2, 2, 'FD');
    doc.setTextColor(249, 227, 58);
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.text('LC', 21, 17, { align: 'center' });

    // Academy Title Header
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('LAASYA CULTURAL ACADEMY', 35, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(249, 227, 58);
    doc.text('ACADEMY OF CLASSICAL DANCE, MUSIC & FINE ARTS', 35, 17);

    doc.setFontSize(7.5);
    doc.setTextColor(230, 210, 225);
    doc.text('VV Maple Hub, 2nd Floor, Kannamangala, Bengaluru - 560067 | Ph: +91 8151 998 899 | info@laasyaacademy.com', 35, 22);

    // 2. DOCUMENT SUBHEADER
    let y = 38;
    doc.setTextColor(45, 4, 26);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('OFFICIAL FEE INVOICE & PAYMENT RECEIPT', 14, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Official Copy • Accounts & Student Records Section', 14, y + 4.5);

    // Status Badge on Right
    const statusText = invoice.status === 'paid' 
      ? 'PAID & SETTLED' 
      : invoice.status === 'partial' 
        ? 'PARTIALLY PAID' 
        : 'PENDING DUE';

    if (invoice.status === 'paid') {
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(16, 185, 129);
      doc.setTextColor(6, 95, 70);
    } else if (invoice.status === 'partial') {
      doc.setFillColor(254, 243, 199);
      doc.setDrawColor(245, 158, 11);
      doc.setTextColor(146, 64, 14);
    } else {
      doc.setFillColor(255, 241, 242);
      doc.setDrawColor(225, 29, 72);
      doc.setTextColor(159, 18, 57);
    }
    doc.setLineWidth(0.4);
    doc.roundedRect(148, y - 5, 48, 9, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(statusText, 172, y + 0.8, { align: 'center' });

    // 3. TWO CARDS: STUDENT DETAILS & INVOICE METADATA
    y = 48;
    const cardHeight = 32;

    // Left Card: Student Info
    doc.setFillColor(255, 249, 251);
    doc.setDrawColor(240, 213, 228);
    doc.roundedRect(14, y, 88, cardHeight, 2, 2, 'FD');

    doc.setTextColor(138, 6, 77);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('STUDENT INFORMATION', 18, y + 6);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    doc.text(invoice.student_name || 'Student', 18, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(90, 90, 90);
    doc.text(`Student ID / Roll: ${invoice.roll_number || '—'}`, 18, y + 17.5);
    doc.text(`Guardian: ${invoice.parent_name || 'Parent / Guardian'}`, 18, y + 22.5);
    doc.text(`Contact: ${invoice.phone || '—'}`, 18, y + 27.5);

    // Right Card: Invoice Meta Info
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(108, y, 88, cardHeight, 2, 2, 'FD');

    doc.setTextColor(138, 6, 77);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('INVOICE & BILLING DETAILS', 112, y + 6);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    doc.text(`Invoice No: ${invoice.invoice_number}`, 112, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(90, 90, 90);
    doc.text(`Billing Period: ${invoice.fee_period || 'Monthly'}`, 112, y + 17.5);
    doc.text(`Due Date: ${formatMonthEndDdMmYy(invoice.due_date || invoice.fee_period || invoice.created_at)}`, 112, y + 22.5);
    doc.text(`Issue Date: ${invoice.created_at ? invoice.created_at.substring(0, 10) : '—'}`, 112, y + 27.5);

    // 4. ITEMS TABLE
    y = 86;
    doc.setFillColor(138, 6, 77);
    doc.rect(14, y, 182, 7.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('COURSE DESCRIPTION', 18, y + 5);
    doc.text('BATCH SLOT', 88, y + 5);
    doc.text('FEE PERIOD', 134, y + 5);
    doc.text('AMOUNT (INR)', 192, y + 5, { align: 'right' });

    // Table Content Row
    y += 7.5;
    doc.setFillColor(255, 255, 255);
    doc.rect(14, y, 182, 10, 'F');
    doc.setDrawColor(230, 230, 230);
    doc.line(14, y + 10, 196, y + 10);

    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(invoice.course_title || 'Academy Course', 18, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 70);
    doc.text(invoice.batch_name || 'Regular Batch', 88, y + 6);
    doc.text(invoice.fee_period || 'Monthly', 134, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(`Rs. ${Number(invoice.total_amount).toLocaleString('en-IN')}`, 192, y + 6, { align: 'right' });

    // Optional Discount Row
    if (Number(invoice.discount_amount) > 0) {
      y += 10;
      doc.setFillColor(240, 253, 244);
      doc.rect(14, y, 182, 8, 'F');
      doc.setDrawColor(220, 245, 225);
      doc.line(14, y + 8, 196, y + 8);

      doc.setTextColor(22, 101, 52);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Academy Scholarship / Fee Concession', 18, y + 5.5);
      doc.text('—', 88, y + 5.5);
      doc.text('—', 134, y + 5.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`- Rs. ${Number(invoice.discount_amount).toLocaleString('en-IN')}`, 192, y + 5.5, { align: 'right' });
    }

    // 5. TOTALS SUMMARY BOX (Right Aligned)
    y += 14;
    const summaryBoxX = 110;
    const summaryBoxW = 86;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(230, 230, 230);
    doc.roundedRect(summaryBoxX, y, summaryBoxW, 28, 2, 2, 'FD');

    // Invoiced Total
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(90, 90, 90);
    doc.text('Total Invoiced Amount:', summaryBoxX + 4, y + 7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(`Rs. ${Number(invoice.total_amount).toLocaleString('en-IN')}`, summaryBoxX + summaryBoxW - 4, y + 7, { align: 'right' });

    // Amount Paid
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 90, 90);
    doc.text('Total Amount Paid:', summaryBoxX + 4, y + 14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(`Rs. ${Number(invoice.paid_amount).toLocaleString('en-IN')}`, summaryBoxX + summaryBoxW - 4, y + 14, { align: 'right' });

    // Balance Due
    doc.setDrawColor(240, 213, 228);
    doc.line(summaryBoxX + 4, y + 18, summaryBoxX + summaryBoxW - 4, y + 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(138, 6, 77);
    doc.text('Outstanding Balance Due:', summaryBoxX + 4, y + 24);
    doc.setTextColor(190, 18, 60);
    doc.text(`Rs. ${Number(invoice.balance_amount).toLocaleString('en-IN')}`, summaryBoxX + summaryBoxW - 4, y + 24, { align: 'right' });

    // 6. PAYMENT HISTORY SECTION (IF PAYMENTS RECORDED)
    y += 34;
    if (invoice.payments && invoice.payments.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(45, 4, 26);
      doc.text(`RECORDED INSTALLMENT RECEIPTS (${invoice.payments.length})`, 14, y);

      y += 3;
      doc.setFillColor(243, 244, 246);
      doc.rect(14, y, 182, 6, 'F');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      doc.text('RECEIPT NO', 18, y + 4.2);
      doc.text('DATE', 65, y + 4.2);
      doc.text('PAYMENT MODE', 105, y + 4.2);
      doc.text('AMOUNT PAID', 192, y + 4.2, { align: 'right' });

      for (const p of invoice.payments) {
        y += 6;
        doc.setFillColor(255, 255, 255);
        doc.rect(14, y, 182, 6.5, 'F');
        doc.setDrawColor(240, 240, 240);
        doc.line(14, y + 6.5, 196, y + 6.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(138, 6, 77);
        doc.text(p.receipt_number, 18, y + 4.5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(70, 70, 70);
        doc.text(p.payment_date || '—', 65, y + 4.5);
        doc.text((p.payment_method || 'UPI').toUpperCase(), 105, y + 4.5);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(5, 150, 105);
        doc.text(`Rs. ${Number(p.amount_paid).toLocaleString('en-IN')}`, 192, y + 4.5, { align: 'right' });
      }
      y += 10;
    }

    // 7. FOOTER & AUTHORIZATION
    const footerY = 270;
    doc.setDrawColor(240, 213, 228);
    doc.setLineWidth(0.4);
    doc.line(14, footerY, 196, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text('Thank you for being part of Laasya Cultural Academy! • Accounts & Administration Portal', 14, footerY + 5);
    doc.text('Official computer-generated receipt. Does not require physical signature.', 14, footerY + 9);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(138, 6, 77);
    doc.text('LAASYA CULTURAL ACADEMY', 196, footerY + 5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('Bengaluru, Karnataka', 196, footerY + 9, { align: 'right' });

    // Save PDF
    doc.save(filename);
    return true;
  } catch (err) {
    console.error('Failed to generate vector invoice PDF:', err);
    return false;
  }
}

/**
 * Downloads a professional vector PDF salary slip for a Guru/Faculty.
 */
export function downloadGuruSalarySlipPdf(
  slip: GuruSalaryRecord,
  customFilename?: string
): boolean {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const filename = customFilename || `Salary_Slip_${slip.guru_name.replace(/\s+/g, '_')}_${slip.payroll_month.replace(/\s+/g, '_')}.pdf`;

    // 1. TOP BANNER: Deep Maroon #590231
    doc.setFillColor(89, 2, 49);
    doc.rect(0, 0, 210, 28, 'F');

    // Golden Accent Line #F9E33A
    doc.setFillColor(249, 227, 58);
    doc.rect(0, 28, 210, 2, 'F');

    // Crest Box 'LC'
    doc.setFillColor(138, 6, 77);
    doc.setDrawColor(249, 227, 58);
    doc.setLineWidth(0.6);
    doc.roundedRect(12, 5, 18, 18, 2, 2, 'FD');
    doc.setTextColor(249, 227, 58);
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.text('LC', 21, 17, { align: 'center' });

    // Academy Title Header
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('LAASYA CULTURAL ACADEMY', 35, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(249, 227, 58);
    doc.text('FACULTY HONORARIUM & SALARY ADVICE', 35, 17);

    doc.setFontSize(7.5);
    doc.setTextColor(230, 210, 225);
    doc.text('VV Maple Hub, 2nd Floor, Kannamangala, Bengaluru - 560067 | Ph: +91 8151 998 899', 35, 22);

    // 2. DOCUMENT SUBHEADER
    let y = 38;
    doc.setTextColor(45, 4, 26);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('GURU SALARY & HONORARIUM VOUCHER', 14, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Voucher ID: LCA-PAY-2026-${slip.id.slice(-5).toUpperCase()} • Month: ${slip.payroll_month}`, 14, y + 4.5);

    // Status Badge
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(16, 185, 129);
    doc.setTextColor(6, 95, 70);
    doc.setLineWidth(0.4);
    doc.roundedRect(148, y - 5, 48, 9, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('PAID & SETTLED', 172, y + 0.8, { align: 'center' });

    // 3. GURU DETAILS CARD
    y = 48;
    doc.setFillColor(255, 249, 251);
    doc.setDrawColor(240, 213, 228);
    doc.roundedRect(14, y, 182, 26, 2, 2, 'FD');

    doc.setTextColor(138, 6, 77);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('FACULTY BENEFICIARY INFORMATION', 18, y + 6);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    doc.text(slip.guru_name, 18, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(90, 90, 90);
    doc.text(`Designation: ${slip.display_title || 'Faculty Guru'}`, 18, y + 17.5);
    doc.text(`Disciplines: ${(slip.specializations || []).join(', ') || 'Classical Arts'}`, 18, y + 22.5);

    doc.text(`Payroll Month: ${slip.payroll_month}`, 120, y + 12);
    doc.text(`Payment Mode: ${(slip.payment_method || 'Bank Transfer').toUpperCase()}`, 120, y + 17.5);
    doc.text(`Txn Ref: ${slip.transaction_reference || 'DIRECT-BANK-NEFT'}`, 120, y + 22.5);

    // 4. EARNINGS & DEDUCTIONS BREAKDOWN TABLE
    y = 80;
    doc.setFillColor(138, 6, 77);
    doc.rect(14, y, 182, 7.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('EARNINGS & INCENTIVES', 18, y + 5);
    doc.text('AMOUNT (INR)', 95, y + 5, { align: 'right' });
    doc.text('DEDUCTIONS & ADVANCES', 110, y + 5);
    doc.text('AMOUNT (INR)', 192, y + 5, { align: 'right' });

    // Row 1
    y += 7.5;
    doc.setFillColor(255, 255, 255);
    doc.rect(14, y, 182, 9, 'F');
    doc.setDrawColor(240, 240, 240);
    doc.line(14, y + 9, 196, y + 9);

    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Base Monthly Salary / Honorarium', 18, y + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${Number(slip.base_salary).toLocaleString('en-IN')}`, 95, y + 5.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.text('Leave / Absence Deductions', 110, y + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(190, 18, 60);
    doc.text(`Rs. ${Number(slip.deduction_amount || 0).toLocaleString('en-IN')}`, 192, y + 5.5, { align: 'right' });

    // Row 2
    y += 9;
    doc.setFillColor(250, 250, 250);
    doc.rect(14, y, 182, 9, 'F');
    doc.setDrawColor(240, 240, 240);
    doc.line(14, y + 9, 196, y + 9);

    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'normal');
    doc.text('Performance / Festival Bonus', 18, y + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(`Rs. ${Number(slip.bonus_amount || 0).toLocaleString('en-IN')}`, 95, y + 5.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text('Salary Advance Settlement', 110, y + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(109, 40, 217);
    doc.text(`Rs. ${Number(slip.advance_deducted || 0).toLocaleString('en-IN')}`, 192, y + 5.5, { align: 'right' });

    // Totals Table Footer
    y += 9;
    doc.setFillColor(243, 244, 246);
    doc.rect(14, y, 182, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);
    doc.text('Total Gross Earnings:', 18, y + 5.5);
    doc.text(`Rs. ${(Number(slip.base_salary) + Number(slip.bonus_amount || 0)).toLocaleString('en-IN')}`, 95, y + 5.5, { align: 'right' });

    doc.text('Total Deductions:', 110, y + 5.5);
    doc.setTextColor(190, 18, 60);
    doc.text(`Rs. ${(Number(slip.deduction_amount || 0) + Number(slip.advance_deducted || 0)).toLocaleString('en-IN')}`, 192, y + 5.5, { align: 'right' });

    // 5. NET DISBURSED HIGHLIGHT BOX
    y += 15;
    doc.setFillColor(255, 249, 251);
    doc.setDrawColor(240, 213, 228);
    doc.setLineWidth(0.6);
    doc.roundedRect(14, y, 182, 24, 2, 2, 'FD');

    doc.setTextColor(138, 6, 77);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('NET REMITTANCE PAYABLE', 18, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text(`Bank Ref: ${slip.transaction_reference || 'DIRECT-BANK-NEFT'} • Disbursed on: ${slip.payment_date || new Date().toISOString().split('T')[0]}`, 18, y + 17);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(5, 150, 105);
    doc.text(`Rs. ${Number(slip.net_salary).toLocaleString('en-IN')}.00`, 192, y + 13, { align: 'right' });

    // 6. FOOTER
    const footerY = 270;
    doc.setDrawColor(240, 213, 228);
    doc.setLineWidth(0.4);
    doc.line(14, footerY, 196, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text('Confidential Faculty Pay Advice • Laasya Cultural Academy Administration', 14, footerY + 5);
    doc.text('Computer-generated voucher. No manual signature required.', 14, footerY + 9);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(138, 6, 77);
    doc.text('LAASYA CULTURAL ACADEMY', 196, footerY + 5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('Bengaluru, Karnataka', 196, footerY + 9, { align: 'right' });

    doc.save(filename);
    return true;
  } catch (err) {
    console.error('Failed to generate vector salary voucher PDF:', err);
    return false;
  }
}

/**
 * Fallback DOM to PDF converter for general elements.
 */
export async function downloadElementAsPdf(
  elementId: string,
  filename: string = 'document.pdf'
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found.`);
    return false;
  }

  try {
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
    }

    pdf.save(filename);
    return true;
  } catch (err) {
    console.error('Error generating PDF with html2canvas:', err);
    return false;
  }
}
