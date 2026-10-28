/**
 * Axis Bank Payment Gateway Adapter & Demo Simulation Architecture
 * Laasya Cultural Academy ERP
 *
 * Provides a clean PaymentGatewayProvider interface for future official Axis Bank integration
 * while powering a robust, traceable, and strictly isolated DEMO simulation engine.
 *
 * CRITICAL RULE: DEMO MODE NEVER TRANSFERS REAL MONEY OR MARKS REAL DUES AS PAID.
 */

export const DEMO_PAYMENT_DISCLAIMER = 'DEMO MODE — NO REAL MONEY WILL BE TRANSFERRED';

export type DemoOutcome = 'SUCCESS' | 'FAILURE' | 'CANCELLED' | 'TIMEOUT' | 'PENDING';

export type AxisPaymentMethod = 'axis_upi' | 'axis_netbanking' | 'axis_card';

export type AxisTransactionStatus = 
  | 'demo_success'
  | 'demo_failed'
  | 'demo_cancelled'
  | 'demo_timeout'
  | 'demo_pending'
  | 'settled'
  | 'pending_reconciliation'
  | 'dev_mock'
  | 'failed';

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
  idempotencyKey?: string;
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
  paymentMethod: AxisPaymentMethod;
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
  paymentMethod: AxisPaymentMethod;
  gatewayBank: string;
  axisUtr: string;
  authCode: string;
  failureCode?: string;
  failureReason?: string;
  customerVpa?: string;
  cardLast4?: string;
  status: AxisTransactionStatus;
  demoOutcome?: DemoOutcome;
  statusLabel: string;
  initiatedAt: string;
  settledAt?: string;
  isMock: boolean;
  disclaimer: string;
  notes?: string;
}

export interface DemoPaymentProcessRequest {
  orderId: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  courseTitle: string;
  feePeriod: string;
  amount: number;
  paymentMethod: AxisPaymentMethod;
  outcome: DemoOutcome;
  payerVpa?: string;
  cardLast4?: string;
  bankName?: string;
}

export interface AxisOrderResult {
  success: boolean;
  orderId: string;
  invoiceNumber?: string;
  merchantId: string;
  currency: 'INR';
  totalAmount: number;
  baseAmount: number;
  gstAmount: number;
  discountAmount: number;
  isLive: boolean;
  isDemo: boolean;
  disclaimer: string;
  payload: any;
  availableSimulations: DemoOutcome[];
}

/**
 * Payment Gateway Provider Abstraction
 * Defines the contract that any payment gateway adapter (Demo or Official Axis) must implement.
 */
export interface PaymentGatewayProvider {
  readonly name: string;
  readonly isLive: boolean;
  createOrder(order: AxisPaymentOrder): Promise<AxisOrderResult>;
  processDemoPayment(req: DemoPaymentProcessRequest): Promise<AxisTransactionRecord>;
  verifyPayment(payload: any): Promise<{ verified: boolean; transaction?: AxisTransactionRecord; error?: string }>;
  queryStatus(orderId: string): Promise<AxisTransactionRecord | null>;
}

export const AXIS_PG_CONFIG: AxisPgConfig = {
  merchantId: process.env.NEXT_PUBLIC_AXIS_MERCHANT_ID || 'AXIS_MERCHANT_LAASYA_01',
  subMerchantId: process.env.NEXT_PUBLIC_AXIS_SUB_MERCHANT_ID || 'SUB_LAASYA_MAIN',
  terminalId: process.env.NEXT_PUBLIC_AXIS_TERMINAL_ID || 'TERM_HYD_01',
  currency: 'INR',
  isLive: false, // Strictly hardcoded false until bank credentials, encryption key & S2S webhook are supplied
  returnUrl: '/api/finance/payments/axis/callback',
  cancelUrl: '/dashboard/student/payments',
};

/**
 * Synthetic test fixtures for demo payments (no real data)
 */
export const SYNTHETIC_DEMO_FIXTURES = {
  upis: [
    { label: 'Primary Test VPA', vpa: 'student.demo@axisbank' },
    { label: 'Alternate Test VPA', vpa: 'admissions.test@axisbank' },
  ],
  cards: [
    { brand: 'Axis Bank Visa Demo', number: '4000 •••• •••• 0002', exp: '12/28', type: 'Credit Card', otp: '123456' },
    { brand: 'Axis Bank RuPay Demo', number: '6071 •••• •••• 0001', exp: '10/29', type: 'Debit Card', otp: '123456' },
  ],
  netBanking: [
    { id: 'AXIS_RET', name: 'Axis Bank Retail NetBanking (Demo)' },
    { id: 'AXIS_CORP', name: 'Axis Bank Corporate Direct Debit (Demo)' },
  ],
  testOtp: '123456',
};

/**
 * In-memory transaction and order store for demo session isolation.
 */
class DemoPaymentStore {
  private activeOrders = new Map<string, AxisPaymentOrder>();
  private transactions: AxisTransactionRecord[] = [];

  constructor() {
    this.seedInitialTransactions();
  }

  private seedInitialTransactions() {
    this.transactions = [
      {
        id: 'axis-demo-101',
        axisOrderId: 'AXIS-DEMO-ORD-20261001-8801',
        merchantRef: 'DEMO-REF-20261001-01',
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
        gatewayBank: 'Axis Bank UPI Gateway (Demo Simulator)',
        axisUtr: 'DEMO-UTR-992817263541',
        authCode: 'SIM-AUTH-9182',
        status: 'demo_success',
        demoOutcome: 'SUCCESS',
        statusLabel: '[DEMO] Simulated Success',
        initiatedAt: '2026-10-01T10:15:00Z',
        settledAt: '2026-10-01T10:15:22Z',
        isMock: true,
        disclaimer: DEMO_PAYMENT_DISCLAIMER,
        notes: 'Simulated payment test approved. Production student ledger untouched.',
      },
      {
        id: 'axis-demo-102',
        axisOrderId: 'AXIS-DEMO-ORD-20261002-8802',
        merchantRef: 'DEMO-REF-20261002-02',
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
        gatewayBank: 'Axis Corporate NetBanking (Demo Simulator)',
        axisUtr: 'DEMO-UTR-448291048201',
        authCode: 'SIM-AUTH-7721',
        status: 'demo_success',
        demoOutcome: 'SUCCESS',
        statusLabel: '[DEMO] Simulated Success',
        initiatedAt: '2026-10-02T14:20:00Z',
        settledAt: '2026-10-02T14:20:45Z',
        isMock: true,
        disclaimer: DEMO_PAYMENT_DISCLAIMER,
        notes: 'Simulated NetBanking Corporate Clearing Verified in Demo Mode.',
      },
      {
        id: 'axis-demo-103',
        axisOrderId: 'AXIS-DEMO-ORD-20261015-8804',
        merchantRef: 'DEMO-REF-20261015-04',
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
        gatewayBank: 'Axis Bank UPI Gateway (Demo Simulator)',
        axisUtr: 'DEMO-UTR-662910482910',
        authCode: 'SIM-PENDING-0019',
        status: 'demo_pending',
        demoOutcome: 'PENDING',
        statusLabel: '[DEMO] Clearance Pending',
        initiatedAt: '2026-10-15T09:30:00Z',
        isMock: true,
        disclaimer: DEMO_PAYMENT_DISCLAIMER,
        notes: 'Demo test simulation: simulated T+1 clearing pending state.',
      },
      {
        id: 'axis-demo-104',
        axisOrderId: 'AXIS-DEMO-ORD-20261020-8805',
        merchantRef: 'DEMO-REF-20261020-05',
        invoiceNumber: 'LCA-INV-2026-10-005',
        studentId: 's-5',
        studentName: 'Rohan Deshmukh',
        rollNumber: 'LCA-5',
        courseTitle: 'Western Keyboard',
        feePeriod: 'October 2026',
        amount: 2200,
        baseAmount: 1864.41,
        gstAmount: 335.59,
        paymentMethod: 'axis_card',
        gatewayBank: 'Axis RuPay Platinum (Demo Simulator)',
        axisUtr: 'DEMO-UTR-DECLINE-01',
        authCode: 'SIM-ERR-DECLINE',
        status: 'demo_failed',
        demoOutcome: 'FAILURE',
        statusLabel: '[DEMO] Bank Decline (Simulated)',
        initiatedAt: '2026-10-20T11:20:00Z',
        isMock: true,
        disclaimer: DEMO_PAYMENT_DISCLAIMER,
        notes: 'Simulated issuer decline test. No funds impacted.',
      },
    ];
  }

  public getOrCreateOrder(order: AxisPaymentOrder): AxisPaymentOrder {
    const key = order.idempotencyKey || `${order.invoiceNumber}_${order.totalAmount}`;
    const existing = this.activeOrders.get(key);
    if (existing) {
      return existing;
    }
    this.activeOrders.set(key, order);
    return order;
  }

  public addTransaction(record: AxisTransactionRecord): void {
    // Avoid duplicate insertions for the same orderId
    const exists = this.transactions.some(t => t.axisOrderId === record.axisOrderId);
    if (!exists) {
      this.transactions.unshift(record);
    }
  }

  public getTransactions(): AxisTransactionRecord[] {
    return [...this.transactions];
  }

  public updateTransaction(id: string, updates: Partial<AxisTransactionRecord>): AxisTransactionRecord | null {
    const idx = this.transactions.findIndex(t => t.id === id || t.axisOrderId === id);
    if (idx !== -1) {
      this.transactions[idx] = { ...this.transactions[idx], ...updates };
      return this.transactions[idx];
    }
    return null;
  }
}

const demoStore = new DemoPaymentStore();

/**
 * Mock Axis Bank Payment Adapter
 * Implements full interactive simulation for demo testing without real banking credentials.
 */
export class MockAxisPaymentAdapter implements PaymentGatewayProvider {
  public readonly name = 'Axis Bank Mock & Demo Adapter';
  public readonly isLive = false;

  public async createOrder(order: AxisPaymentOrder): Promise<AxisOrderResult> {
    if (!order.totalAmount || order.totalAmount <= 0) {
      throw new Error('Payment total amount must be greater than 0');
    }

    if (!order.orderId) {
      const safeInv = (order.invoiceNumber || 'INV-DEMO').replace(/[^a-zA-Z0-9-]/g, '');
      const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      order.orderId = `AXIS-DEMO-ORD-${dateStamp}-${safeInv.slice(-5)}`;
    }

    const resolvedOrder = demoStore.getOrCreateOrder(order);
    const timestamp = Date.now();
    const merchantTxnRef = `DEMO-REF-${timestamp.toString().slice(-8)}`;

    const payload = {
      merchantId: AXIS_PG_CONFIG.merchantId,
      subMerchantId: AXIS_PG_CONFIG.subMerchantId,
      terminalId: AXIS_PG_CONFIG.terminalId,
      merchantTxnRef,
      orderId: resolvedOrder.orderId,
      amount: resolvedOrder.totalAmount.toFixed(2),
      currency: AXIS_PG_CONFIG.currency,
      studentName: resolvedOrder.studentName,
      studentRoll: resolvedOrder.rollNumber,
      course: resolvedOrder.courseTitle,
      invoiceNumber: resolvedOrder.invoiceNumber,
      isDemo: true,
      disclaimer: DEMO_PAYMENT_DISCLAIMER,
      syntheticFixtures: SYNTHETIC_DEMO_FIXTURES,
    };

    return {
      success: true,
      orderId: resolvedOrder.orderId,
      invoiceNumber: resolvedOrder.invoiceNumber,
      merchantId: AXIS_PG_CONFIG.merchantId,
      currency: AXIS_PG_CONFIG.currency,
      totalAmount: resolvedOrder.totalAmount,
      baseAmount: resolvedOrder.baseAmount,
      gstAmount: resolvedOrder.gstAmount,
      discountAmount: resolvedOrder.discountAmount,
      isLive: false,
      isDemo: true,
      disclaimer: DEMO_PAYMENT_DISCLAIMER,
      payload,
      availableSimulations: ['SUCCESS', 'FAILURE', 'CANCELLED', 'TIMEOUT', 'PENDING'],
    };
  }

  public async processDemoPayment(req: DemoPaymentProcessRequest): Promise<AxisTransactionRecord> {
    if (req.orderId) {
      const existing = demoStore.getTransactions().find(t => t.axisOrderId === req.orderId);
      if (existing) {
        return existing;
      }
    }

    const timestamp = Date.now();
    const isSuccess = req.outcome === 'SUCCESS';
    const isPending = req.outcome === 'PENDING';
    const isFailed = req.outcome === 'FAILURE';
    const isTimeout = req.outcome === 'TIMEOUT';

    let status: AxisTransactionStatus = 'demo_success';
    let statusLabel = '[DEMO] Simulated Success';
    let authCode = `SIM-AUTH-${Math.floor(Math.random() * 8999 + 1000)}`;
    let failureCode: string | undefined;
    let failureReason: string | undefined;

    if (isFailed) {
      status = 'demo_failed';
      statusLabel = '[DEMO] Bank Decline (Simulated)';
      authCode = 'SIM-ERR-DECLINE-05';
      failureCode = 'ERR_BANK_DECLINED';
      failureReason = 'Simulated issuer decline: insufficient limits or transaction policy block.';
    } else if (req.outcome === 'CANCELLED') {
      status = 'demo_cancelled';
      statusLabel = '[DEMO] User Cancelled';
      authCode = 'SIM-USER-CANCEL';
      failureCode = 'USER_ABORTED';
      failureReason = 'Payment aborted by user before authorization completed.';
    } else if (isTimeout) {
      status = 'demo_timeout';
      statusLabel = '[DEMO] Gateway Timeout (Simulated)';
      authCode = 'SIM-ERR-TIMEOUT-504';
      failureCode = 'AUTH_TIMEOUT';
      failureReason = 'Simulated 2FA / OTP verification window expired.';
    } else if (isPending) {
      status = 'demo_pending';
      statusLabel = '[DEMO] Clearance Pending';
      authCode = 'SIM-PENDING-CLEAR';
      failureCode = 'STATUS_PENDING';
      failureReason = 'Transaction in clearance queue. Simulated bank settlement pending.';
    }

    const baseAmount = Number((req.amount / 1.18).toFixed(2));
    const gstAmount = Number((req.amount - baseAmount).toFixed(2));
    const randSuffix = Math.floor(Math.random() * 8999 + 1000);

    const record: AxisTransactionRecord = {
      id: `axis-demo-${timestamp}-${randSuffix}`,
      axisOrderId: req.orderId || `AXIS-DEMO-ORD-${timestamp}-${randSuffix}`,
      merchantRef: `DEMO-REF-${timestamp.toString().slice(-6)}-${randSuffix}`,
      invoiceNumber: req.invoiceNumber,
      studentId: req.studentId,
      studentName: req.studentName,
      rollNumber: req.rollNumber,
      courseTitle: req.courseTitle,
      feePeriod: req.feePeriod,
      amount: req.amount,
      baseAmount,
      gstAmount,
      paymentMethod: req.paymentMethod,
      gatewayBank: `Axis Bank Demo Simulator (${req.paymentMethod.replace('axis_', '').toUpperCase()})`,
      axisUtr: isSuccess || isPending ? `DEMO-UTR-${timestamp.toString().slice(-10)}` : 'N/A-UNSETTLED',
      authCode,
      failureCode,
      failureReason,
      customerVpa: req.payerVpa,
      cardLast4: req.cardLast4,
      status,
      demoOutcome: req.outcome,
      statusLabel,
      initiatedAt: new Date().toISOString(),
      settledAt: isSuccess ? new Date().toISOString() : undefined,
      isMock: true,
      disclaimer: DEMO_PAYMENT_DISCLAIMER,
      notes: isSuccess
        ? 'Demo checkout approved. Production invoice dues remain strictly untouched.'
        : `Demo simulation: outcome was ${req.outcome}. No charges incurred.`,
    };

    demoStore.addTransaction(record);
    return record;
  }

  public async verifyPayment(payload: any): Promise<{ verified: boolean; transaction?: AxisTransactionRecord; error?: string }> {
    const orderId = payload?.orderId || payload?.axisOrderId;
    const all = demoStore.getTransactions();
    const txn = all.find(t => t.axisOrderId === orderId || t.merchantRef === payload?.merchantRef);
    if (!txn) {
      return { verified: false, error: 'Transaction not found in demo registry' };
    }
    return {
      verified: txn.status === 'demo_success',
      transaction: txn,
    };
  }

  public async queryStatus(orderId: string): Promise<AxisTransactionRecord | null> {
    const all = demoStore.getTransactions();
    return all.find(t => t.axisOrderId === orderId || t.id === orderId || t.merchantRef === orderId) || null;
  }
}

/**
 * Singleton active payment provider instance.
 * Defaults strictly to MockAxisPaymentAdapter.
 */
export const defaultPaymentGateway: PaymentGatewayProvider = new MockAxisPaymentAdapter();

/**
 * Helper to generate Axis compliant payment payload (legacy backward-compatible helper)
 */
export function createAxisPaymentPayload(order: AxisPaymentOrder) {
  const timestamp = Date.now();
  const merchantTxnRef = `DEMO-REF-${timestamp.toString().slice(-8)}`;

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
    isMock: true,
    isDemo: true,
    disclaimer: DEMO_PAYMENT_DISCLAIMER,
  };
}

export const INITIAL_AXIS_TRANSACTIONS = demoStore.getTransactions();

export function getActiveDemoTransactions(): AxisTransactionRecord[] {
  return demoStore.getTransactions();
}

export function updateDemoTransaction(id: string, updates: Partial<AxisTransactionRecord>): AxisTransactionRecord | null {
  return demoStore.updateTransaction(id, updates);
}
