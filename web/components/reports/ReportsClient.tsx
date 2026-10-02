'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  X, 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3, 
  Users, 
  BookOpen, 
  Receipt, 
  Banknote, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  FileSpreadsheet, 
  FileDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import { Course, Batch, Student, Trainer } from '@/lib/academy';
import { 
  ReportType, 
  AttendanceReportSummary, 
  AttendanceReportRow, 
  FeesReportSummary, 
  FeesReportRow, 
  SalariesReportSummary, 
  SalariesReportRow, 
  IncomeExpensesReportSummary, 
  IncomeExpensesReportRow 
} from '@/lib/reports';

interface Props {
  courses: Course[];
  batches: Batch[];
  students: Student[];
  trainers: Trainer[];
}

export default function ReportsClient({ courses, batches, students, trainers }: Props) {
  const [activeType, setActiveType] = useState<ReportType>('attendance');

  // Shared / Dynamic Filters
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [selectedBatchId, setSelectedBatchId] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState('all');
  const [selectedTrainerId, setSelectedTrainerId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPayrollMonth, setSelectedPayrollMonth] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Report Data State
  const [attendanceData, setAttendanceData] = useState<{
    summary: AttendanceReportSummary;
    records: AttendanceReportRow[];
    generatedAt: string;
  } | null>(null);

  const [feesData, setFeesData] = useState<{
    summary: FeesReportSummary;
    records: FeesReportRow[];
    generatedAt: string;
  } | null>(null);

  const [salariesData, setSalariesData] = useState<{
    summary: SalariesReportSummary;
    records: SalariesReportRow[];
    generatedAt: string;
  } | null>(null);

  const [incomeExpensesData, setIncomeExpensesData] = useState<{
    summary: IncomeExpensesReportSummary;
    records: IncomeExpensesReportRow[];
    generatedAt: string;
  } | null>(null);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Available batches based on selected course
  const availableBatches = useMemo(() => {
    if (selectedCourseId === 'all') return batches;
    return batches.filter(b => b.course_id === selectedCourseId);
  }, [selectedCourseId, batches]);

  // Fetch Report Data from API
  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams();
      params.set('type', activeType);

      if (selectedCourseId !== 'all') params.set('courseId', selectedCourseId);
      if (selectedBatchId !== 'all') params.set('batchId', selectedBatchId);
      if (selectedStudentId !== 'all') params.set('studentId', selectedStudentId);
      if (selectedTrainerId !== 'all') params.set('trainerId', selectedTrainerId);
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      if (selectedPayrollMonth !== 'all') params.set('payrollMonth', selectedPayrollMonth);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to generate report');
      }

      if (activeType === 'attendance') {
        setAttendanceData({ summary: json.summary, records: json.records, generatedAt: json.generatedAt });
      } else if (activeType === 'fees') {
        setFeesData({ summary: json.summary, records: json.records, generatedAt: json.generatedAt });
      } else if (activeType === 'salaries') {
        setSalariesData({ summary: json.summary, records: json.records, generatedAt: json.generatedAt });
      } else if (activeType === 'income_expenses') {
        setIncomeExpensesData({ summary: json.summary, records: json.records, generatedAt: json.generatedAt });
      }
    } catch (err: any) {
      console.error('Error fetching report:', err);
      setErrorMessage(err.message || 'Unable to retrieve report records. Please verify connectivity and retry.');
    } finally {
      setIsLoading(false);
    }
  }, [
    activeType,
    selectedCourseId,
    selectedBatchId,
    selectedStudentId,
    selectedTrainerId,
    selectedStatus,
    selectedPayrollMonth,
    startDate,
    endDate
  ]);

  // Refetch when filters or report type changes
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Reset batch when course changes
  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedBatchId('all');
  };

  // Clear Filters
  const clearFilters = () => {
    setSelectedCourseId('all');
    setSelectedBatchId('all');
    setSelectedStudentId('all');
    setSelectedTrainerId('all');
    setSelectedStatus('all');
    setSelectedPayrollMonth('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = Boolean(
    selectedCourseId !== 'all' ||
    selectedBatchId !== 'all' ||
    selectedStudentId !== 'all' ||
    selectedTrainerId !== 'all' ||
    selectedStatus !== 'all' ||
    selectedPayrollMonth !== 'all' ||
    startDate ||
    endDate
  );

  // Current Generated At Timestamp
  const currentGeneratedAt = useMemo(() => {
    if (activeType === 'attendance') return attendanceData?.generatedAt;
    if (activeType === 'fees') return feesData?.generatedAt;
    if (activeType === 'salaries') return salariesData?.generatedAt;
    return incomeExpensesData?.generatedAt;
  }, [activeType, attendanceData, feesData, salariesData, incomeExpensesData]);

  // Record Count
  const currentRecordCount = useMemo(() => {
    if (activeType === 'attendance') return attendanceData?.records.length || 0;
    if (activeType === 'fees') return feesData?.records.length || 0;
    if (activeType === 'salaries') return salariesData?.records.length || 0;
    return incomeExpensesData?.records.length || 0;
  }, [activeType, attendanceData, feesData, salariesData, incomeExpensesData]);

  // ==========================================
  // EXPORTS IMPLEMENTATION (CSV, EXCEL, PDF)
  // ==========================================

  // 1. Export CSV
  const exportCSV = () => {
    let rows: string[][] = [];
    let filename = `laasya_${activeType}_report.csv`;

    if (activeType === 'attendance' && attendanceData) {
      rows.push(['Session Date', 'Course', 'Batch', 'Student Name', 'Roll Number', 'Status', 'Check-in Time', 'Remarks']);
      attendanceData.records.forEach(r => {
        rows.push([r.session_date, r.course_title, r.batch_name, r.student_name, r.roll_number, r.status, r.check_in_time || 'N/A', r.remarks || '']);
      });
    } else if (activeType === 'fees' && feesData) {
      rows.push(['Invoice Number', 'Student Name', 'Course', 'Batch', 'Period', 'Due Date', 'Billed (Rs)', 'Discount (Rs)', 'Paid (Rs)', 'Balance (Rs)', 'Status', 'Last Payment Date', 'Payment Method']);
      feesData.records.forEach(r => {
        rows.push([r.invoice_number, r.student_name, r.course_title, r.batch_name, r.fee_period, r.due_date, String(r.total_amount), String(r.discount_amount), String(r.paid_amount), String(r.balance_amount), r.status, r.last_payment_date || 'N/A', r.payment_method || 'N/A']);
      });
    } else if (activeType === 'salaries' && salariesData) {
      rows.push(['Trainer Name', 'Title', 'Payroll Month', 'Base Salary (Rs)', 'Classes Conducted', 'Bonus (Rs)', 'Deductions (Rs)', 'Advance Deducted (Rs)', 'Net Salary (Rs)', 'Status', 'Payment Date', 'Payment Method']);
      salariesData.records.forEach(r => {
        rows.push([r.trainer_name, r.display_title, r.payroll_month, String(r.base_salary), String(r.classes_conducted), String(r.bonus_amount), String(r.deduction_amount), String(r.advance_deducted), String(r.net_salary), r.status, r.payment_date || 'N/A', r.payment_method || 'N/A']);
      });
    } else if (activeType === 'income_expenses' && incomeExpensesData) {
      rows.push(['Date', 'Type', 'Category', 'Description', 'Amount (Rs)', 'Payment Method', 'Reference']);
      incomeExpensesData.records.forEach(r => {
        rows.push([r.date, r.type, r.category, r.description, String(r.amount), r.payment_method, r.reference || 'N/A']);
      });
    }

    if (rows.length === 0) {
      alert('No data available to export.');
      return;
    }

    const csvContent = '\uFEFF' + rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Export Excel
  const exportExcel = () => {
    // Generate valid Microsoft Excel XML spreadsheet
    let title = `Laasya Academy ${activeType.toUpperCase()} Report`;
    let filename = `laasya_${activeType}_report.xls`;
    let headers: string[] = [];
    let rows: string[][] = [];

    if (activeType === 'attendance' && attendanceData) {
      headers = ['Session Date', 'Course', 'Batch', 'Student Name', 'Roll Number', 'Status', 'Remarks'];
      rows = attendanceData.records.map(r => [r.session_date, r.course_title, r.batch_name, r.student_name, r.roll_number, r.status, r.remarks || '']);
    } else if (activeType === 'fees' && feesData) {
      headers = ['Invoice Number', 'Student Name', 'Course', 'Period', 'Due Date', 'Billed (Rs)', 'Paid (Rs)', 'Balance (Rs)', 'Status'];
      rows = feesData.records.map(r => [r.invoice_number, r.student_name, r.course_title, r.fee_period, r.due_date, String(r.total_amount), String(r.paid_amount), String(r.balance_amount), r.status]);
    } else if (activeType === 'salaries' && salariesData) {
      headers = ['Guru Name', 'Display Title', 'Month', 'Base (Rs)', 'Classes', 'Bonus (Rs)', 'Net (Rs)', 'Status'];
      rows = salariesData.records.map(r => [r.trainer_name, r.display_title, r.payroll_month, String(r.base_salary), String(r.classes_conducted), String(r.bonus_amount), String(r.net_salary), r.status]);
    } else if (activeType === 'income_expenses' && incomeExpensesData) {
      headers = ['Date', 'Type', 'Category', 'Description', 'Amount (Rs)', 'Method', 'Reference'];
      rows = incomeExpensesData.records.map(r => [r.date, r.type, r.category, r.description, String(r.amount), r.payment_method, r.reference || '']);
    }

    if (rows.length === 0) {
      alert('No data available to export.');
      return;
    }

    let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Report">
  <Table>
   <Row><Cell><Data ss:Type="String">${title}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Generated: ${new Date().toLocaleString('en-GB')}</Data></Cell></Row>
   <Row></Row>
   <Row>
    ${headers.map(h => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('')}
   </Row>
   ${rows.map(r => `
   <Row>
    ${r.map(cell => `<Cell><Data ss:Type="String">${String(cell).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>`).join('')}
   </Row>`).join('')}
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Export PDF
  const exportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      let y = 15;

      // Header Banner
      doc.setFillColor(89, 2, 49); // #590231 Maroon
      doc.rect(0, 0, 210, 25, 'F');

      doc.setTextColor(249, 227, 58); // #F9E33A Gold
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('LAASYA CULTURAL ACADEMY', 14, 11);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Official Academic Report: ${activeType.toUpperCase().replace('_', ' ')}`, 14, 18);

      y = 35;
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(9);
      doc.text(`Date Range: ${startDate || 'All Time'} to ${endDate || 'Current'}`, 14, y);
      doc.text(`Generated On: ${new Date().toLocaleString('en-GB')}`, 130, y);

      y += 8;
      doc.setDrawColor(240, 213, 228);
      doc.line(14, y, 196, y);
      y += 8;

      // Report Specific Summary
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(89, 2, 49);
      doc.text('EXECUTIVE METRICS SUMMARY', 14, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);

      if (activeType === 'attendance' && attendanceData) {
        doc.text(`• Total Tracked Sessions: ${attendanceData.summary.totalSessions}`, 14, y);
        doc.text(`• Present: ${attendanceData.summary.presentCount}`, 80, y);
        doc.text(`• Attendance Rate: ${attendanceData.summary.attendancePercentage}%`, 140, y);
        y += 5;
        doc.text(`• Absent: ${attendanceData.summary.absentCount}`, 14, y);
        doc.text(`• Late: ${attendanceData.summary.lateCount}`, 80, y);
        doc.text(`• Not-marked: ${attendanceData.summary.notMarkedCount}`, 140, y);
      } else if (activeType === 'fees' && feesData) {
        doc.text(`• Total Collected: Rs. ${feesData.summary.totalCollected.toLocaleString('en-IN')}`, 14, y);
        doc.text(`• Outstanding: Rs. ${feesData.summary.totalOutstanding.toLocaleString('en-IN')}`, 80, y);
        doc.text(`• Overdue: Rs. ${feesData.summary.totalOverdue.toLocaleString('en-IN')}`, 140, y);
      } else if (activeType === 'salaries' && salariesData) {
        doc.text(`• Total Payable: Rs. ${salariesData.summary.totalPayable.toLocaleString('en-IN')}`, 14, y);
        doc.text(`• Paid: Rs. ${salariesData.summary.totalPaid.toLocaleString('en-IN')}`, 80, y);
        doc.text(`• Pending: Rs. ${salariesData.summary.totalPending.toLocaleString('en-IN')}`, 140, y);
      } else if (activeType === 'income_expenses' && incomeExpensesData) {
        doc.text(`• Fee Income: Rs. ${incomeExpensesData.summary.totalIncome.toLocaleString('en-IN')}`, 14, y);
        doc.text(`• Total Expenses: Rs. ${incomeExpensesData.summary.totalExpenses.toLocaleString('en-IN')}`, 80, y);
        doc.text(`• Net Surplus: Rs. ${incomeExpensesData.summary.netOperatingAmount.toLocaleString('en-IN')}`, 140, y);
      }

      y += 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(89, 2, 49);
      doc.text(`DETAILED RECORDS (${currentRecordCount} Filtered Entries)`, 14, y);
      y += 6;

      // Table Header
      doc.setFillColor(255, 242, 248);
      doc.rect(14, y - 4, 182, 7, 'F');
      doc.setFontSize(8);
      doc.setTextColor(89, 2, 49);

      if (activeType === 'attendance' && attendanceData) {
        doc.text('Date', 16, y);
        doc.text('Student', 40, y);
        doc.text('Course / Batch', 90, y);
        doc.text('Status', 150, y);
        doc.text('Roll No', 175, y);
        y += 6;
        attendanceData.records.slice(0, 30).forEach(r => {
          if (y > 275) { doc.addPage(); y = 20; }
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(40, 40, 40);
          doc.text(String(r.session_date), 16, y);
          doc.text(String(r.student_name).slice(0, 22), 40, y);
          doc.text(String(r.course_title).slice(0, 25), 90, y);
          doc.text(String(r.status).toUpperCase(), 150, y);
          doc.text(String(r.roll_number), 175, y);
          y += 5.5;
        });
      } else if (activeType === 'fees' && feesData) {
        doc.text('Invoice #', 16, y);
        doc.text('Student Name', 50, y);
        doc.text('Period', 105, y);
        doc.text('Paid (Rs)', 140, y);
        doc.text('Balance (Rs)', 170, y);
        y += 6;
        feesData.records.slice(0, 30).forEach(r => {
          if (y > 275) { doc.addPage(); y = 20; }
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(40, 40, 40);
          doc.text(String(r.invoice_number), 16, y);
          doc.text(String(r.student_name).slice(0, 24), 50, y);
          doc.text(String(r.fee_period), 105, y);
          doc.text(String(r.paid_amount), 140, y);
          doc.text(String(r.balance_amount), 170, y);
          y += 5.5;
        });
      } else if (activeType === 'salaries' && salariesData) {
        doc.text('Guru Name', 16, y);
        doc.text('Month', 65, y);
        doc.text('Classes', 105, y);
        doc.text('Net Salary (Rs)', 135, y);
        doc.text('Status', 170, y);
        y += 6;
        salariesData.records.slice(0, 30).forEach(r => {
          if (y > 275) { doc.addPage(); y = 20; }
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(40, 40, 40);
          doc.text(String(r.trainer_name).slice(0, 22), 16, y);
          doc.text(String(r.payroll_month), 65, y);
          doc.text(String(r.classes_conducted), 105, y);
          doc.text(String(r.net_salary), 135, y);
          doc.text(String(r.status).toUpperCase(), 170, y);
          y += 5.5;
        });
      } else if (activeType === 'income_expenses' && incomeExpensesData) {
        doc.text('Date', 16, y);
        doc.text('Category', 40, y);
        doc.text('Type', 85, y);
        doc.text('Description', 115, y);
        doc.text('Amount (Rs)', 170, y);
        y += 6;
        incomeExpensesData.records.slice(0, 30).forEach(r => {
          if (y > 275) { doc.addPage(); y = 20; }
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(40, 40, 40);
          doc.text(String(r.date), 16, y);
          doc.text(String(r.category).slice(0, 18), 40, y);
          doc.text(String(r.type).slice(0, 12), 85, y);
          doc.text(String(r.description).slice(0, 24), 115, y);
          doc.text(String(r.amount), 170, y);
          y += 5.5;
        });
      }

      // Save PDF
      doc.save(`laasya_${activeType}_report.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Unable to generate PDF directly. Please use Excel or CSV export.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#F0D5E4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF2F8] border border-[#F0D5E4] flex items-center justify-center text-[#8A064D]">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#590231] tracking-tight">
              Academy Reports & Audits
            </h1>
            <p className="text-sm font-semibold text-gray-500">
              Audit attendance, tuition fees, trainer payroll, and income vs expenses with direct export
            </p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#F0D5E4] hover:bg-[#FFF2F8] text-gray-700 hover:text-[#8A064D] text-xs font-black shadow-xs transition cursor-pointer"
            title="Export filtered records as CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#F0D5E4] hover:bg-[#FFF2F8] text-gray-700 hover:text-[#8A064D] text-xs font-black shadow-xs transition cursor-pointer"
            title="Export filtered records as Excel Spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-700" />
            <span>Excel</span>
          </button>

          <button
            onClick={exportPDF}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#8A064D] hover:bg-[#590231] text-white text-xs font-black shadow-md transition border border-[#F9E33A]/60 cursor-pointer"
            title="Download official PDF report"
          >
            <FileDown className="w-4 h-4 text-[#F9E33A]" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Report Types Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Attendance Tab */}
        <button
          onClick={() => {
            setActiveType('attendance');
            clearFilters();
          }}
          className={`p-4 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
            activeType === 'attendance'
              ? 'bg-[#590231] text-white border-[#F9E33A] shadow-md'
              : 'bg-white text-gray-800 border-[#F0D5E4] hover:bg-[#FFF9FB]'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${activeType === 'attendance' ? 'bg-[#8A064D] text-[#F9E33A]' : 'bg-[#FFF2F8] text-[#8A064D]'}`}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight">Attendance</div>
            <div className={`text-[11px] font-semibold ${activeType === 'attendance' ? 'text-rose-200' : 'text-gray-500'}`}>
              Presence & audit rates
            </div>
          </div>
        </button>

        {/* Fees Tab */}
        <button
          onClick={() => {
            setActiveType('fees');
            clearFilters();
          }}
          className={`p-4 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
            activeType === 'fees'
              ? 'bg-[#590231] text-white border-[#F9E33A] shadow-md'
              : 'bg-white text-gray-800 border-[#F0D5E4] hover:bg-[#FFF9FB]'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${activeType === 'fees' ? 'bg-[#8A064D] text-[#F9E33A]' : 'bg-[#FFF2F8] text-[#8A064D]'}`}>
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight">Student Fees</div>
            <div className={`text-[11px] font-semibold ${activeType === 'fees' ? 'text-rose-200' : 'text-gray-500'}`}>
              Collections & dues
            </div>
          </div>
        </button>

        {/* Salaries Tab */}
        <button
          onClick={() => {
            setActiveType('salaries');
            clearFilters();
          }}
          className={`p-4 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
            activeType === 'salaries'
              ? 'bg-[#590231] text-white border-[#F9E33A] shadow-md'
              : 'bg-white text-gray-800 border-[#F0D5E4] hover:bg-[#FFF9FB]'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${activeType === 'salaries' ? 'bg-[#8A064D] text-[#F9E33A]' : 'bg-[#FFF2F8] text-[#8A064D]'}`}>
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight">Guru Salaries</div>
            <div className={`text-[11px] font-semibold ${activeType === 'salaries' ? 'text-rose-200' : 'text-gray-500'}`}>
              Payroll & bonuses
            </div>
          </div>
        </button>

        {/* Income vs Expenses Tab */}
        <button
          onClick={() => {
            setActiveType('income_expenses');
            clearFilters();
          }}
          className={`p-4 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
            activeType === 'income_expenses'
              ? 'bg-[#590231] text-white border-[#F9E33A] shadow-md'
              : 'bg-white text-gray-800 border-[#F0D5E4] hover:bg-[#FFF9FB]'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${activeType === 'income_expenses' ? 'bg-[#8A064D] text-[#F9E33A]' : 'bg-[#FFF2F8] text-[#8A064D]'}`}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight">Income vs Expenses</div>
            <div className={`text-[11px] font-semibold ${activeType === 'income_expenses' ? 'text-rose-200' : 'text-gray-500'}`}>
              P&L and net surplus
            </div>
          </div>
        </button>

      </div>

      {/* Dynamic Filters Bar based on active report type */}
      <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs space-y-4">
        
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0D5E4]/60 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#8A064D]" />
            <span className="text-xs font-black text-[#590231] uppercase tracking-wider">
              {activeType.replace('_', ' ')} Report Parameters & Filters
            </span>
          </div>

          {/* Timestamp Display Rule: Always show the selected date range and the time the report was generated */}
          <div className="flex items-center gap-3 text-xs font-semibold text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#8A064D]" />
              Range: <strong>{startDate || 'Start'}</strong> to <strong>{endDate || 'Present'}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-800 font-bold">
              <Clock className="w-3.5 h-3.5" />
              Generated: {currentGeneratedAt ? new Date(currentGeneratedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'Live'}
            </span>
          </div>
        </div>

        {/* Dynamic Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Attendance Report Filters: Course, Batch, Student, Date Range */}
          {activeType === 'attendance' && (
            <>
              {/* Course */}
              <div>
                <label className="text-xs font-black text-gray-600 uppercase block mb-1">Course</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800"
                >
                  <option value="all">All Courses</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              {/* Batch */}
              <div>
                <label className="text-xs font-black text-gray-600 uppercase block mb-1">Batch</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800"
                >
                  <option value="all">All Batches</option>
                  {availableBatches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Student */}
              <div>
                <label className="text-xs font-black text-gray-600 uppercase block mb-1">Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800"
                >
                  <option value="all">All Students</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.roll_number})</option>
                  ))}
                </select>
              </div>

              {/* Date Pickers in 4th col */}
              <div className="flex items-center gap-1 pt-4">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-1/2 px-2 py-1.5 rounded-lg bg-[#FFF9FB] border border-[#F0D5E4] text-[11px] font-bold"
                  title="From date"
                />
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-1/2 px-2 py-1.5 rounded-lg bg-[#FFF9FB] border border-[#F0D5E4] text-[11px] font-bold"
                  title="To date"
                />
              </div>
            </>
          )}

          {/* Fees Report Filters: Course, Batch, Status, Date Range */}
          {activeType === 'fees' && (
            <>
              <div>
                <label className="text-xs font-black text-gray-600 uppercase block mb-1">Course</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800"
                >
                  <option value="all">All Courses</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-gray-600 uppercase block mb-1">Batch</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800"
                >
                  <option value="all">All Batches</option>
                  {availableBatches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-gray-600 uppercase block mb-1">Invoice Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800"
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <div className="flex items-center gap-1 pt-4">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-1/2 px-2 py-1.5 rounded-lg bg-[#FFF9FB] border border-[#F0D5E4] text-[11px] font-bold"
                  title="Due from"
                />
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-1/2 px-2 py-1.5 rounded-lg bg-[#FFF9FB] border border-[#F0D5E4] text-[11px] font-bold"
                  title="Due to"
                />
              </div>
            </>
          )}

          {/* Salaries Report Filters: Payroll Month, Trainer, Status */}
          {activeType === 'salaries' && (
            <>
              <div>
                <label className="text-xs font-black text-gray-600 uppercase block mb-1">Payroll Month</label>
                <select
                  value={selectedPayrollMonth}
                  onChange={(e) => setSelectedPayrollMonth(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800"
                >
                  <option value="all">All Payroll Months</option>
                  <option value="2026-10">October 2026</option>
                  <option value="2026-09">September 2026</option>
                  <option value="2026-08">August 2026</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-gray-600 uppercase block mb-1">Trainer (Guru)</label>
                <select
                  value={selectedTrainerId}
                  onChange={(e) => setSelectedTrainerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800"
                >
                  <option value="all">All Trainers</option>
                  {trainers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-gray-600 uppercase block mb-1">Disbursement Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800"
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="flex items-center justify-end pt-4">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-[#8A064D] text-xs font-bold"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear filters</span>
                  </button>
                )}
              </div>
            </>
          )}

          {/* Income vs Expenses Report Filters: Date Range */}
          {activeType === 'income_expenses' && (
            <>
              <div className="md:col-span-2">
                <label className="text-xs font-black text-gray-600 uppercase block mb-1">Accounting Period Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800"
                  />
                  <span className="text-xs font-bold text-gray-400">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800"
                  />
                </div>
              </div>

              <div className="md:col-span-2 flex items-center justify-end pt-4 gap-2">
                <span className="text-xs font-semibold text-gray-500">
                  Note: General expenses dynamically match records from the Expenses ledger.
                </span>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-[#8A064D] text-xs font-bold"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </>
          )}

        </div>

      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="bg-white rounded-3xl p-12 border border-[#F0D5E4] shadow-xs text-center flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#8A064D] animate-spin" />
          <h3 className="text-base font-black text-[#590231]">
            Compiling and auditing report records...
          </h3>
          <p className="text-xs font-semibold text-gray-400">
            Matching underlying ledger records for exact precision
          </p>
        </div>
      )}

      {/* Error State with Plain-Language Message & Retry */}
      {!isLoading && errorMessage && (
        <div className="bg-white rounded-3xl p-10 border border-red-200 shadow-xs text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-gray-900">
            Unable to load {activeType.replace('_', ' ')} report
          </h3>
          <p className="text-xs font-semibold text-gray-600 max-w-md">
            {errorMessage}
          </p>
          <button
            onClick={() => fetchReport()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8A064D] text-white text-xs font-black shadow-md hover:bg-[#590231] transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Loading Report</span>
          </button>
        </div>
      )}

      {/* Empty State: Rule: "No records match these filters. Clear filters or change the date range." */}
      {!isLoading && !errorMessage && currentRecordCount === 0 && (
        <div className="bg-white rounded-3xl p-12 border border-[#F0D5E4] shadow-xs text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#FFF2F8] border border-[#F0D5E4] flex items-center justify-center text-[#8A064D]">
            <FileText className="w-8 h-8" />
          </div>
          <div className="max-w-md">
            <h3 className="text-lg font-black text-[#590231]">
              No records match these filters. Clear filters or change the date range.
            </h3>
            <p className="text-xs font-semibold text-gray-500 mt-1">
              Adjust your course, batch, or date selection above to audit available records.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-5 py-2.5 rounded-xl bg-[#8A064D] text-white text-xs font-black hover:bg-[#590231] shadow-md transition"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* REPORT CONTENT VIEWPORT */}
      {!isLoading && !errorMessage && currentRecordCount > 0 && (
        <div className="space-y-6">
          
          {/* ========================================================= */}
          {/* 1. ATTENDANCE REPORT VIEW */}
          {/* ========================================================= */}
          {activeType === 'attendance' && attendanceData && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                
                <div className="bg-white rounded-3xl p-5 border border-[#F0D5E4] shadow-xs">
                  <div className="text-xs font-black text-gray-500 uppercase">Sessions Audited</div>
                  <div className="text-3xl font-black text-[#590231] mt-2">
                    {attendanceData.summary.totalSessions}
                  </div>
                  <div className="text-[11px] font-semibold text-gray-400 mt-1">Class sessions</div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-xs">
                  <div className="text-xs font-black text-emerald-800 uppercase">Present</div>
                  <div className="text-3xl font-black text-emerald-700 mt-2">
                    {attendanceData.summary.presentCount}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-600 mt-1">Full attendance</div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-purple-200 shadow-xs">
                  <div className="text-xs font-black text-purple-800 uppercase">Late</div>
                  <div className="text-3xl font-black text-purple-700 mt-2">
                    {attendanceData.summary.lateCount}
                  </div>
                  <div className="text-[11px] font-semibold text-purple-600 mt-1">Admitted with delay</div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-red-200 shadow-xs">
                  <div className="text-xs font-black text-red-800 uppercase">Absent</div>
                  <div className="text-3xl font-black text-red-700 mt-2">
                    {attendanceData.summary.absentCount}
                  </div>
                  <div className="text-[11px] font-semibold text-red-600 mt-1">Unexcused / Leave</div>
                </div>

                <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-white to-[#FFF9FB] rounded-3xl p-5 border border-[#F9E33A] shadow-xs">
                  <div className="text-xs font-black text-[#854D0E] uppercase flex items-center justify-between">
                    <span>Attendance Rate</span>
                    <Percent className="w-4 h-4 text-[#854D0E]" />
                  </div>
                  <div className="text-3xl font-black text-[#590231] mt-2">
                    {attendanceData.summary.attendancePercentage}%
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-700 mt-1 font-bold">
                    Presence proportion
                  </div>
                </div>

              </div>

              {/* Attendance Progress Chart */}
              <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#590231] uppercase tracking-wider">
                    Attendance Composition Breakdown
                  </span>
                  <span className="text-xs font-bold text-gray-500">
                    {attendanceData.summary.totalSessions} Total Tracked Entries
                  </span>
                </div>
                
                {/* Visual Stacked Progress Bar */}
                <div className="h-6 w-full rounded-xl bg-gray-100 overflow-hidden flex shadow-inner">
                  {attendanceData.summary.totalSessions > 0 && (
                    <>
                      <div 
                        style={{ width: `${(attendanceData.summary.presentCount / attendanceData.summary.totalSessions) * 100}%` }}
                        className="bg-emerald-600 h-full transition-all"
                        title={`Present: ${attendanceData.summary.presentCount}`}
                      />
                      <div 
                        style={{ width: `${(attendanceData.summary.lateCount / attendanceData.summary.totalSessions) * 100}%` }}
                        className="bg-purple-600 h-full transition-all"
                        title={`Late: ${attendanceData.summary.lateCount}`}
                      />
                      <div 
                        style={{ width: `${(attendanceData.summary.absentCount / attendanceData.summary.totalSessions) * 100}%` }}
                        className="bg-red-600 h-full transition-all"
                        title={`Absent: ${attendanceData.summary.absentCount}`}
                      />
                      <div 
                        style={{ width: `${(attendanceData.summary.notMarkedCount / attendanceData.summary.totalSessions) * 100}%` }}
                        className="bg-gray-300 h-full transition-all"
                        title={`Not Marked: ${attendanceData.summary.notMarkedCount}`}
                      />
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-bold pt-1">
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" /> Present ({attendanceData.summary.presentCount})
                  </span>
                  <span className="flex items-center gap-1.5 text-purple-800">
                    <span className="w-3 h-3 rounded-full bg-purple-600 inline-block" /> Late ({attendanceData.summary.lateCount})
                  </span>
                  <span className="flex items-center gap-1.5 text-red-800">
                    <span className="w-3 h-3 rounded-full bg-red-600 inline-block" /> Absent ({attendanceData.summary.absentCount})
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <span className="w-3 h-3 rounded-full bg-gray-400 inline-block" /> Not Marked ({attendanceData.summary.notMarkedCount})
                  </span>
                </div>
              </div>

              {/* Detailed Table */}
              <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-[#F0D5E4] bg-[#FFF9FB] flex items-center justify-between">
                  <h3 className="font-black text-sm text-[#590231] uppercase tracking-wider">
                    Detailed Attendance Audit Records
                  </h3>
                  <span className="text-xs font-semibold text-gray-500">
                    {attendanceData.records.length} records matching criteria
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#FFF2F8] text-[#590231] border-b border-[#F0D5E4] text-xs font-black uppercase tracking-wider">
                        <th className="py-3 px-5">Session Date</th>
                        <th className="py-3 px-5">Student</th>
                        <th className="py-3 px-5">Roll No</th>
                        <th className="py-3 px-5">Course</th>
                        <th className="py-3 px-5">Batch</th>
                        <th className="py-3 px-5 text-center">Audit Status</th>
                        <th className="py-3 px-5">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0D5E4]/60">
                      {attendanceData.records.map((r, i) => (
                        <tr key={i} className="hover:bg-[#FFF9FB] transition">
                          <td className="py-3.5 px-5 font-bold text-gray-700 whitespace-nowrap">
                            {r.session_date ? new Date(r.session_date).toLocaleDateString('en-GB') : '—'}
                          </td>
                          <td className="py-3.5 px-5 font-bold text-gray-900">
                            {r.student_name}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-gray-500">
                            {r.roll_number}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-gray-800">
                            {r.course_title}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-gray-600">
                            {r.batch_name}
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                              r.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                              r.status === 'late' ? 'bg-purple-100 text-purple-800' :
                              r.status === 'absent' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {r.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-xs text-gray-500">
                            {r.remarks || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* 2. FEES REPORT VIEW */}
          {/* ========================================================= */}
          {activeType === 'fees' && feesData && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                
                <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-xs">
                  <div className="text-xs font-black text-emerald-800 uppercase">Collected</div>
                  <div className="text-2xl md:text-3xl font-black text-emerald-700 mt-2">
                    ₹{feesData.summary.totalCollected.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-600 mt-1">Paid in range</div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-xs">
                  <div className="text-xs font-black text-amber-800 uppercase">Outstanding</div>
                  <div className="text-2xl md:text-3xl font-black text-amber-700 mt-2">
                    ₹{feesData.summary.totalOutstanding.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-semibold text-amber-600 mt-1">Pending clearance</div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-red-200 shadow-xs">
                  <div className="text-xs font-black text-red-800 uppercase">Overdue</div>
                  <div className="text-2xl md:text-3xl font-black text-red-700 mt-2">
                    ₹{feesData.summary.totalOverdue.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-semibold text-red-600 mt-1">Past due date</div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-[#F0D5E4] shadow-xs">
                  <div className="text-xs font-black text-[#8A064D] uppercase">Discounts</div>
                  <div className="text-2xl md:text-3xl font-black text-[#590231] mt-2">
                    ₹{feesData.summary.totalDiscounts.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-semibold text-gray-500 mt-1">Scholarships/offers</div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs">
                  <div className="text-xs font-black text-gray-700 uppercase">Refunds</div>
                  <div className="text-2xl md:text-3xl font-black text-gray-800 mt-2">
                    ₹{feesData.summary.totalRefunds.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-semibold text-gray-400 mt-1">Returned amounts</div>
                </div>

              </div>

              {/* Payment Method Breakdown Cards */}
              <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs space-y-4">
                <h4 className="text-xs font-black text-[#590231] uppercase tracking-wider">
                  Payment Method Breakdown & Channels
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {feesData.summary.paymentMethodBreakdown.map((pm, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-black text-[#8A064D] uppercase">{pm.method}</div>
                        <div className="text-sm font-semibold text-gray-500">{pm.count} transactions</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-[#590231]">₹{Number(pm.total).toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Fees Table */}
              <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-[#F0D5E4] bg-[#FFF9FB] flex items-center justify-between">
                  <h3 className="font-black text-sm text-[#590231] uppercase tracking-wider">
                    Tuition Fee Invoices & Audit Records
                  </h3>
                  <span className="text-xs font-semibold text-gray-500">
                    {feesData.records.length} records matching filters
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#FFF2F8] text-[#590231] border-b border-[#F0D5E4] text-xs font-black uppercase tracking-wider">
                        <th className="py-3 px-5">Invoice #</th>
                        <th className="py-3 px-5">Student</th>
                        <th className="py-3 px-5">Course</th>
                        <th className="py-3 px-5">Fee Period</th>
                        <th className="py-3 px-5">Due Date</th>
                        <th className="py-3 px-5 text-right">Billed</th>
                        <th className="py-3 px-5 text-right">Paid</th>
                        <th className="py-3 px-5 text-right">Balance</th>
                        <th className="py-3 px-5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0D5E4]/60">
                      {feesData.records.map((r, i) => (
                        <tr key={i} className="hover:bg-[#FFF9FB] transition">
                          <td className="py-3.5 px-5 font-bold text-gray-900 whitespace-nowrap">
                            {r.invoice_number}
                          </td>
                          <td className="py-3.5 px-5 font-bold text-gray-900">
                            {r.student_name}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-gray-700">
                            {r.course_title}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-gray-500">
                            {r.fee_period}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-gray-600 whitespace-nowrap">
                            {r.due_date ? new Date(r.due_date).toLocaleDateString('en-GB') : '—'}
                          </td>
                          <td className="py-3.5 px-5 text-right font-semibold text-gray-700">
                            ₹{Number(r.total_amount).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-5 text-right font-black text-emerald-700">
                            ₹{Number(r.paid_amount).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-5 text-right font-black text-amber-700">
                            ₹{Number(r.balance_amount).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                              r.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                              r.status === 'partial' ? 'bg-amber-100 text-amber-800' :
                              r.status === 'overdue' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {r.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* 3. SALARIES REPORT VIEW */}
          {/* ========================================================= */}
          {activeType === 'salaries' && salariesData && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                
                <div className="bg-white rounded-3xl p-5 border border-[#F0D5E4] shadow-xs">
                  <div className="text-xs font-black text-gray-500 uppercase">Total Payable</div>
                  <div className="text-2xl md:text-3xl font-black text-[#590231] mt-2">
                    ₹{salariesData.summary.totalPayable.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-semibold text-gray-400 mt-1">Full payroll bill</div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-xs">
                  <div className="text-xs font-black text-emerald-800 uppercase">Total Paid</div>
                  <div className="text-2xl md:text-3xl font-black text-emerald-700 mt-2">
                    ₹{salariesData.summary.totalPaid.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-600 mt-1">Disbursed successfully</div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-xs">
                  <div className="text-xs font-black text-amber-800 uppercase">Pending</div>
                  <div className="text-2xl md:text-3xl font-black text-amber-700 mt-2">
                    ₹{salariesData.summary.totalPending.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-semibold text-amber-600 mt-1">Awaiting release</div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-[#FEF9C3] shadow-xs">
                  <div className="text-xs font-black text-[#854D0E] uppercase">Bonuses</div>
                  <div className="text-2xl md:text-3xl font-black text-[#854D0E] mt-2">
                    ₹{salariesData.summary.totalBonuses.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-semibold text-gray-500 mt-1">Performance rewards</div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-red-200 shadow-xs">
                  <div className="text-xs font-black text-red-800 uppercase">Deductions</div>
                  <div className="text-2xl md:text-3xl font-black text-red-700 mt-2">
                    ₹{salariesData.summary.totalDeductions.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-semibold text-red-600 mt-1">Advances & leaves</div>
                </div>

              </div>

              {/* Detailed Salaries Table */}
              <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-[#F0D5E4] bg-[#FFF9FB] flex items-center justify-between">
                  <h3 className="font-black text-sm text-[#590231] uppercase tracking-wider">
                    Guru Payroll & Salary Audit
                  </h3>
                  <span className="text-xs font-semibold text-gray-500">
                    {salariesData.records.length} gurus on record
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#FFF2F8] text-[#590231] border-b border-[#F0D5E4] text-xs font-black uppercase tracking-wider">
                        <th className="py-3 px-5">Guru Name</th>
                        <th className="py-3 px-5">Title</th>
                        <th className="py-3 px-5">Month</th>
                        <th className="py-3 px-5 text-center">Classes</th>
                        <th className="py-3 px-5 text-right">Base</th>
                        <th className="py-3 px-5 text-right">Bonus</th>
                        <th className="py-3 px-5 text-right">Deductions</th>
                        <th className="py-3 px-5 text-right">Net Payable</th>
                        <th className="py-3 px-5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0D5E4]/60">
                      {salariesData.records.map((r, i) => (
                        <tr key={i} className="hover:bg-[#FFF9FB] transition">
                          <td className="py-3.5 px-5 font-bold text-gray-900">
                            {r.trainer_name}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-gray-600">
                            {r.display_title}
                          </td>
                          <td className="py-3.5 px-5 font-bold text-[#8A064D]">
                            {r.payroll_month}
                          </td>
                          <td className="py-3.5 px-5 text-center font-bold text-gray-700">
                            {r.classes_conducted}
                          </td>
                          <td className="py-3.5 px-5 text-right font-semibold text-gray-700">
                            ₹{Number(r.base_salary).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-5 text-right font-semibold text-[#854D0E]">
                            +₹{Number(r.bonus_amount).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-5 text-right font-semibold text-red-600">
                            -₹{(Number(r.deduction_amount) + Number(r.advance_deducted)).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-5 text-right font-black text-base text-[#590231]">
                            ₹{Number(r.net_salary).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                              r.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {r.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* 4. INCOME VS EXPENSES REPORT VIEW */}
          {/* ========================================================= */}
          {activeType === 'income_expenses' && incomeExpensesData && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-xs">
                  <div className="text-xs font-black text-emerald-800 uppercase flex items-center justify-between">
                    <span>Fee Revenue</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-black text-emerald-700 mt-2">
                    ₹{incomeExpensesData.summary.totalIncome.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-600 mt-1">Total tuition collections</div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-rose-200 shadow-xs">
                  <div className="text-xs font-black text-[#8A064D] uppercase flex items-center justify-between">
                    <span>Guru Salaries</span>
                    <Banknote className="w-4 h-4 text-[#8A064D]" />
                  </div>
                  <div className="text-3xl font-black text-[#8A064D] mt-2">
                    ₹{incomeExpensesData.summary.totalSalaries.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-semibold text-gray-500 mt-1">Paid trainer disbursements</div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-xs">
                  <div className="text-xs font-black text-amber-800 uppercase flex items-center justify-between">
                    <span>Academy Expenses</span>
                    <Receipt className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-3xl font-black text-amber-800 mt-2">
                    ₹{incomeExpensesData.summary.totalOtherExpenses.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-bold text-amber-700 mt-1">From Expenses Page ledger</div>
                </div>

                <div className="bg-gradient-to-br from-white to-[#FFF9FB] rounded-3xl p-5 border border-[#F9E33A] shadow-xs">
                  <div className="text-xs font-black text-[#590231] uppercase flex items-center justify-between">
                    <span>Net Operating Surplus</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#FEF9C3] text-[#854D0E]">
                      {incomeExpensesData.summary.status}
                    </span>
                  </div>
                  <div className={`text-3xl font-black mt-2 ${
                    incomeExpensesData.summary.netOperatingAmount >= 0 ? 'text-emerald-700' : 'text-red-600'
                  }`}>
                    ₹{incomeExpensesData.summary.netOperatingAmount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-semibold text-gray-500 mt-1">
                    Income - (Salaries + Expenses)
                  </div>
                </div>

              </div>

              {/* Simple Visual Comparison Bar Chart */}
              <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-[#590231] uppercase tracking-wider">
                    Revenue vs Outflow Proportions
                  </h4>
                  <span className="text-xs font-bold text-gray-500">
                    Total Outflow: ₹{incomeExpensesData.summary.totalExpenses.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Comparative Visual Bars */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-emerald-700">Gross Income (Fee Collections)</span>
                      <span>₹{incomeExpensesData.summary.totalIncome.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="h-4 w-full rounded-xl bg-gray-100 overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-xl" style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-rose-700">Guru Payroll Outflow</span>
                      <span>₹{incomeExpensesData.summary.totalSalaries.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="h-4 w-full rounded-xl bg-gray-100 overflow-hidden">
                      <div 
                        className="bg-[#8A064D] h-full rounded-xl" 
                        style={{ width: `${incomeExpensesData.summary.totalIncome > 0 ? (incomeExpensesData.summary.totalSalaries / incomeExpensesData.summary.totalIncome) * 100 : 0}%` }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-amber-700">General Academy Spending (Expenses Page)</span>
                      <span>₹{incomeExpensesData.summary.totalOtherExpenses.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="h-4 w-full rounded-xl bg-gray-100 overflow-hidden">
                      <div 
                        className="bg-amber-600 h-full rounded-xl" 
                        style={{ width: `${incomeExpensesData.summary.totalIncome > 0 ? (incomeExpensesData.summary.totalOtherExpenses / incomeExpensesData.summary.totalIncome) * 100 : 0}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown Table */}
              <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-[#F0D5E4] bg-[#FFF9FB] flex items-center justify-between">
                  <h3 className="font-black text-sm text-[#590231] uppercase tracking-wider">
                    Detailed Financial Ledger & Transaction Flow
                  </h3>
                  <span className="text-xs font-semibold text-gray-500">
                    {incomeExpensesData.records.length} items recorded
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#FFF2F8] text-[#590231] border-b border-[#F0D5E4] text-xs font-black uppercase tracking-wider">
                        <th className="py-3 px-5">Date</th>
                        <th className="py-3 px-5">Flow Type</th>
                        <th className="py-3 px-5">Category</th>
                        <th className="py-3 px-5">Description</th>
                        <th className="py-3 px-5">Method</th>
                        <th className="py-3 px-5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0D5E4]/60">
                      {incomeExpensesData.records.map((r, i) => (
                        <tr key={i} className="hover:bg-[#FFF9FB] transition">
                          <td className="py-3.5 px-5 font-bold text-gray-700 whitespace-nowrap">
                            {r.date ? new Date(r.date).toLocaleDateString('en-GB') : '—'}
                          </td>
                          <td className="py-3.5 px-5">
                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
                              r.type === 'Income' ? 'bg-emerald-100 text-emerald-800' :
                              r.type === 'Salary Expense' ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {r.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 font-bold text-gray-800">
                            {r.category}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-gray-600 max-w-xs truncate">
                            {r.description}
                          </td>
                          <td className="py-3.5 px-5 text-xs text-gray-500">
                            {r.payment_method}
                          </td>
                          <td className={`py-3.5 px-5 text-right font-black ${
                            r.type === 'Income' ? 'text-emerald-700' : 'text-[#8A064D]'
                          }`}>
                            {r.type === 'Income' ? '+' : '-'}₹{Number(r.amount).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      )}

    </div>
  );
}
