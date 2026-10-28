/**
 * Axis Bank Payment Gateway (Axis EasyPay / Axis PG) Integration Module
 * Laasya Cultural Academy ERP
 *
 * Designed specifically for Axis Bank Merchant Gateway.
 * Supports production PG checkout configuration and safe development mock simulations.
 */

export interface AxisPgConfig {
  merchantId: string;
  subMerchantId?: string;
  terminalId?: string;
  currency: 'INR';
  isLive: boolean;
  returnUrl: string;
  cancelUrl: string;
}

export interface AxisPaymentOrder {
  orderId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  courseTitle: string;
  feePeriod: string;
  invoiceNumber: string;
  baseAmount: number;
  gstAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: 'axis_upi' | 'axis_netbanking' | 'axis_card';
  bankName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface AxisTransactionRecord {
  id: string;
  axisOrderId: string;
  merchantRef: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  courseTitle: string;
  feePeriod: string;
  amount: number;
  baseAmount: number;
  gstAmount: number;
  paymentMethod: 'axis_upi' | 'axis_netbanking' | 'axis_card';
  gatewayBank: string;
  axisUtr: string;
  authCode: string;
  status: 'settled' | 'pending_reconciliation' | 'dev_mock' | 'failed';
  initiatedAt: string;
  settledAt?: string;
  isMock: boolean;
  notes?: string;
}

export const AXIS_PG_CONFIG: AxisPgConfig = {
  merchantId: process.env.NEXT_PUBLIC_AXIS_MERCHANT_ID || 'AXIS_MERCHANT_LAASYA_01',
  subMerchantId: process.env.NEXT_PUBLIC_AXIS_SUB_MERCHANT_ID || 'SUB_LAASYA_MAIN',
  terminalId: process.env.NEXT_PUBLIC_AXIS_TERMINAL_ID || 'TERM_HYD_01',
  currency: 'INR',
  isLive: process.env.NEXT_PUBLIC_AXIS_PG_LIVE === 'true',
  returnUrl: '/api/finance/payments/axis/callback',
  cancelUrl: '/dashboard/student/payments',
};

/**
 * Generates an Axis Bank compliant payment request payload.
 */
export function createAxisPaymentPayload(order: AxisPaymentOrder) {
  const timestamp = Date.now();
  const merchantTxnRef = `AXIS-LCA-${timestamp}-${Math.floor(Math.random() * 900 + 100)}`;
  
  return {
    merchantId: AXIS_PG_CONFIG.merchantId,
    subMerchantId: AXIS_PG_CONFIG.subMerchantId,
    terminalId: AXIS_PG_CONFIG.terminalId,
    merchantTxnRef,
    orderId: order.orderId,
    amount: order.totalAmount.toFixed(2),
    currency: AXIS_PG_CONFIG.currency,
    studentName: order.studentName,
    studentRoll: order.rollNumber,
    course: order.courseTitle,
    invoiceNumber: order.invoiceNumber,
    returnUrl: AXIS_PG_CONFIG.returnUrl,
    isMock: !AXIS_PG_CONFIG.isLive,
  };
}

/**
 * Initial sample Axis Bank transactions for the Admin Reconciliation Dashboard.
 */
export const INITIAL_AXIS_TRANSACTIONS: AxisTransactionRecord[] = [
  {
    id: 'axis-txn-101',
    axisOrderId: 'AXIS-ORD-2026-8801',
    merchantRef: 'LCA-AXIS-20261001-01',
    invoiceNumber: 'LCA-INV-2026-10-001',
    studentId: 's-1',
    studentName: 'Sanjana Krishnamurthy',
    rollNumber: 'LCA-1',
    courseTitle: 'Bharatanatyam (Arangetram Track)',
    feePeriod: 'October 2026',
    amount: 3500,
    baseAmount: 2966.10,
    gstAmount: 533.90,
    paymentMethod: 'axis_upi',
    gatewayBank: 'Axis Bank UPI Gateway',
    axisUtr: 'AXIS-UTR-992817263541',
    authCode: 'AUTH-AX9182',
    status: 'settled',
    initiatedAt: '2026-10-01T10:15:00Z',
    settledAt: '2026-10-01T10:15:22Z',
    isMock: false,
    notes: 'Direct Axis UPI auto-settled to Academy Current A/C #921020084920192',
  },
  {
    id: 'axis-txn-102',
    axisOrderId: 'AXIS-ORD-2026-8802',
    merchantRef: 'LCA-AXIS-20261002-02',
    invoiceNumber: 'LCA-INV-2026-10-002',
    studentId: 's-2',
    studentName: 'Meera Nambiar',
    rollNumber: 'LCA-2',
    courseTitle: 'Carnatic Vocal Music',
    feePeriod: 'October 2026',
    amount: 2500,
    baseAmount: 2118.64,
    gstAmount: 381.36,
    paymentMethod: 'axis_netbanking',
    gatewayBank: 'Axis Corporate NetBanking',
    axisUtr: 'AXIS-UTR-448291048201',
    authCode: 'AUTH-NB7721',
    status: 'settled',
    initiatedAt: '2026-10-02T14:20:00Z',
    settledAt: '2026-10-02T14:20:45Z',
    isMock: false,
    notes: 'Axis NetBanking Corporate Clearing Verified',
  },
  {
    id: 'axis-txn-103',
    axisOrderId: 'AXIS-ORD-2026-8803',
    merchantRef: 'LCA-AXIS-20261003-03',
    invoiceNumber: 'LCA-INV-2026-10-003',
    studentId: 's-3',
    studentName: 'Aarav Patel',
    rollNumber: 'LCA-3',
    courseTitle: 'Kuchipudi Classical Dance',
    feePeriod: 'October 2026',
    amount: 3000,
    baseAmount: 2542.37,
    gstAmount: 457.63,
    paymentMethod: 'axis_card',
    gatewayBank: 'Axis RuPay Platinum Clearing',
    axisUtr: 'AXIS-UTR-119284729103',
    authCode: 'AUTH-CD3391',
    status: 'settled',
    initiatedAt: '2026-10-03T16:45:00Z',
    settledAt: '2026-10-03T16:45:30Z',
    isMock: false,
    notes: 'RuPay Debit 2FA Authorized',
  },
  {
    id: 'axis-txn-104',
    axisOrderId: 'AXIS-ORD-2026-8804',
    merchantRef: 'LCA-AXIS-20261015-04',
    invoiceNumber: 'LCA-INV-2026-10-004',
    studentId: 's-4',
    studentName: 'Ananya Sharma',
    rollNumber: 'LCA-4',
    courseTitle: 'Kathak & Abhinaya',
    feePeriod: 'October 2026',
    amount: 2800,
    baseAmount: 2372.88,
    gstAmount: 427.12,
    paymentMethod: 'axis_upi',
    gatewayBank: 'Axis Bank UPI Gateway',
    axisUtr: 'AXIS-UTR-662910482910',
    authCode: 'AUTH-AX0019',
    status: 'pending_reconciliation',
    initiatedAt: '2026-10-15T09:30:00Z',
    isMock: false,
    notes: 'Bank webhook received; awaiting T+1 NEFT settlement cycle',
  },
  {
    id: 'axis-txn-105',
    axisOrderId: 'AXIS-ORD-2026-8805',
    merchantRef: 'LCA-AXIS-20261028-TEST',
    invoiceNumber: 'LCA-INV-2026-10-006',
    studentId: 's-6',
    studentName: 'Aditi Sundaram',
    rollNumber: 'LCA-6',
    courseTitle: 'Bharathanatyam',
    feePeriod: 'October 2026',
    amount: 2000,
    baseAmount: 1694.92,
    gstAmount: 305.08,
    paymentMethod: 'axis_upi',
    gatewayBank: 'Axis PG Test Simulator',
    axisUtr: 'AXIS-MOCK-991827364501',
    authCode: 'MOCK-DEV-9901',
    status: 'dev_mock',
    initiatedAt: '2026-10-28T09:00:00Z',
    settledAt: '2026-10-28T09:00:15Z',
    isMock: true,
    notes: 'Development test simulation. Real fee dues in database remain unaffected.',
  },
];
