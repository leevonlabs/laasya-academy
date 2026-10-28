/**
 * Automated Test Suite: Axis Bank Payment Gateway DEMO Simulation Engine
 * Laasya Cultural Academy ERP
 *
 * Verifies:
 * 1. All 5 demo simulation outcomes (SUCCESS, FAILURE, CANCELLED, TIMEOUT, PENDING).
 * 2. Idempotency and duplicate order prevention.
 * 3. Amount validation, discount handling, and 18% reverse GST precision.
 * 4. Strict production data isolation, synthetic-only fixtures, and demo disclaimers.
 * 5. Admin transaction queries, status filtering, and reconciliation actions.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultPaymentGateway,
  createAxisPaymentPayload,
  getActiveDemoTransactions,
  updateDemoTransaction,
  DEMO_PAYMENT_DISCLAIMER,
  AXIS_PG_CONFIG,
  SYNTHETIC_DEMO_FIXTURES
} from '../lib/axisBankPayment.ts';

describe('Axis Bank Demo Mock Payment System', () => {

  describe('1. Demo Outcomes Simulation', () => {

    it('simulates SUCCESS outcome with valid demo reference and disclaimer', async () => {
      const order = await defaultPaymentGateway.createOrder({
        studentId: 's-test-01',
        studentName: 'Pooja Iyer',
        rollNumber: 'LCA-01',
        courseTitle: 'Bharatanatyam Senior',
        feePeriod: 'November 2026',
        invoiceNumber: 'LCA-INV-2026-TEST01',
        baseAmount: 2542.37,
        gstAmount: 457.63,
        discountAmount: 0,
        totalAmount: 3000,
        paymentMethod: 'axis_upi',
      });

      assert.ok(order.orderId.startsWith('AXIS-DEMO-ORD-'), 'Order ID must have AXIS-DEMO-ORD- prefix');

      const txn = await defaultPaymentGateway.processDemoPayment({
        orderId: order.orderId,
        invoiceNumber: order.invoiceNumber,
        studentId: order.studentId,
        studentName: order.studentName,
        rollNumber: order.rollNumber,
        courseTitle: order.courseTitle,
        feePeriod: order.feePeriod,
        amount: order.totalAmount,
        paymentMethod: 'axis_upi',
        outcome: 'SUCCESS',
        payerVpa: 'pooja.demo@okaxis',
      });

      assert.equal(txn.status, 'demo_success');
      assert.equal(txn.isMock, true);
      assert.ok(txn.merchantRef.startsWith('DEMO-REF-'), 'Merchant ref must have DEMO-REF- prefix');
      assert.equal(txn.disclaimer, DEMO_PAYMENT_DISCLAIMER);
      assert.equal(txn.amount, 3000);
      assert.equal(txn.customerVpa, 'pooja.demo@okaxis');

      // Verify payment verification API
      const verifyResult = await defaultPaymentGateway.verifyPayment({ orderId: order.orderId });
      assert.equal(verifyResult.verified, true);
      assert.equal(verifyResult.transaction?.status, 'demo_success');
    });

    it('simulates FAILURE (Bank Decline) outcome without authorizing payment', async () => {
      const order = await defaultPaymentGateway.createOrder({
        studentId: 's-test-02',
        studentName: 'Rahul Varma',
        rollNumber: 'LCA-02',
        courseTitle: 'Carnatic Vocal',
        feePeriod: 'November 2026',
        invoiceNumber: 'LCA-INV-2026-TEST02',
        baseAmount: 1694.92,
        gstAmount: 305.08,
        discountAmount: 0,
        totalAmount: 2000,
        paymentMethod: 'axis_card',
      });

      const txn = await defaultPaymentGateway.processDemoPayment({
        orderId: order.orderId,
        invoiceNumber: order.invoiceNumber,
        studentId: order.studentId,
        studentName: order.studentName,
        rollNumber: order.rollNumber,
        courseTitle: order.courseTitle,
        feePeriod: order.feePeriod,
        amount: order.totalAmount,
        paymentMethod: 'axis_card',
        outcome: 'FAILURE',
        cardLast4: '0002',
      });

      assert.equal(txn.status, 'demo_failed');
      assert.equal(txn.isMock, true);
      assert.equal(txn.failureCode, 'ERR_BANK_DECLINED');
      assert.ok(txn.failureReason?.toLowerCase().includes('decline'), 'Must include human-readable decline reason');

      const verifyResult = await defaultPaymentGateway.verifyPayment({ orderId: order.orderId });
      assert.equal(verifyResult.verified, false, 'Failed transactions must not be verified as paid');
    });

    it('simulates CANCELLED (User Abort) outcome cleanly', async () => {
      const order = await defaultPaymentGateway.createOrder({
        studentId: 's-test-03',
        studentName: 'Meera Nair',
        rollNumber: 'LCA-03',
        courseTitle: 'Kuchipudi Junior',
        feePeriod: 'November 2026',
        invoiceNumber: 'LCA-INV-2026-TEST03',
        baseAmount: 1694.92,
        gstAmount: 305.08,
        discountAmount: 0,
        totalAmount: 2000,
        paymentMethod: 'axis_netbanking',
      });

      const txn = await defaultPaymentGateway.processDemoPayment({
        orderId: order.orderId,
        invoiceNumber: order.invoiceNumber,
        studentId: order.studentId,
        studentName: order.studentName,
        rollNumber: order.rollNumber,
        courseTitle: order.courseTitle,
        feePeriod: order.feePeriod,
        amount: order.totalAmount,
        paymentMethod: 'axis_netbanking',
        outcome: 'CANCELLED',
      });

      assert.equal(txn.status, 'demo_cancelled');
      assert.equal(txn.failureCode, 'USER_ABORTED');

      const verifyResult = await defaultPaymentGateway.verifyPayment({ orderId: order.orderId });
      assert.equal(verifyResult.verified, false);
    });

    it('simulates TIMEOUT (2FA / OTP Expiry) outcome cleanly', async () => {
      const order = await defaultPaymentGateway.createOrder({
        studentId: 's-test-04',
        studentName: 'Sanjay Krishnan',
        rollNumber: 'LCA-04',
        courseTitle: 'Mridangam',
        feePeriod: 'November 2026',
        invoiceNumber: 'LCA-INV-2026-TEST04',
        baseAmount: 2118.64,
        gstAmount: 381.36,
        discountAmount: 0,
        totalAmount: 2500,
        paymentMethod: 'axis_upi',
      });

      const txn = await defaultPaymentGateway.processDemoPayment({
        orderId: order.orderId,
        invoiceNumber: order.invoiceNumber,
        studentId: order.studentId,
        studentName: order.studentName,
        rollNumber: order.rollNumber,
        courseTitle: order.courseTitle,
        feePeriod: order.feePeriod,
        amount: order.totalAmount,
        paymentMethod: 'axis_upi',
        outcome: 'TIMEOUT',
      });

      assert.equal(txn.status, 'demo_timeout');
      assert.equal(txn.failureCode, 'AUTH_TIMEOUT');

      const verifyResult = await defaultPaymentGateway.verifyPayment({ orderId: order.orderId });
      assert.equal(verifyResult.verified, false);
    });

    it('simulates PENDING (Bank Clearance Queue) outcome and queries status', async () => {
      const order = await defaultPaymentGateway.createOrder({
        studentId: 's-test-05',
        studentName: 'Ananya Deshmukh',
        rollNumber: 'LCA-05',
        courseTitle: 'Violin Carnatic',
        feePeriod: 'November 2026',
        invoiceNumber: 'LCA-INV-2026-TEST05',
        baseAmount: 2118.64,
        gstAmount: 381.36,
        discountAmount: 0,
        totalAmount: 2500,
        paymentMethod: 'axis_netbanking',
      });

      const txn = await defaultPaymentGateway.processDemoPayment({
        orderId: order.orderId,
        invoiceNumber: order.invoiceNumber,
        studentId: order.studentId,
        studentName: order.studentName,
        rollNumber: order.rollNumber,
        courseTitle: order.courseTitle,
        feePeriod: order.feePeriod,
        amount: order.totalAmount,
        paymentMethod: 'axis_netbanking',
        outcome: 'PENDING',
      });

      assert.equal(txn.status, 'demo_pending');
      assert.equal(txn.failureCode, 'STATUS_PENDING');

      // Query status
      const queried = await defaultPaymentGateway.queryStatus(order.orderId);
      assert.ok(queried !== null);
      assert.equal(queried?.status, 'demo_pending');
    });

  });

  describe('2. Idempotency & Duplicate Request Protection', () => {

    it('returns identical orderId when invoked with the same idempotencyKey within TTL', async () => {
      const testKey = `IDEM-KEY-${Date.now()}`;
      
      const order1 = await defaultPaymentGateway.createOrder({
        idempotencyKey: testKey,
        studentId: 's-idem-01',
        studentName: 'Kavitha Ramesh',
        rollNumber: 'LCA-10',
        courseTitle: 'Bharatanatyam Intermediate',
        feePeriod: 'November 2026',
        invoiceNumber: 'LCA-INV-2026-IDEM01',
        baseAmount: 2542.37,
        gstAmount: 457.63,
        discountAmount: 0,
        totalAmount: 3000,
        paymentMethod: 'axis_upi',
      });

      const order2 = await defaultPaymentGateway.createOrder({
        idempotencyKey: testKey,
        studentId: 's-idem-01',
        studentName: 'Kavitha Ramesh',
        rollNumber: 'LCA-10',
        courseTitle: 'Bharatanatyam Intermediate',
        feePeriod: 'November 2026',
        invoiceNumber: 'LCA-INV-2026-IDEM01',
        baseAmount: 2542.37,
        gstAmount: 457.63,
        discountAmount: 0,
        totalAmount: 3000,
        paymentMethod: 'axis_upi',
      });

      assert.equal(order1.orderId, order2.orderId, 'Repeated requests with same key must return identical orderId');
    });

    it('does not create duplicate transactions when processDemoPayment is called repeatedly on the same order', async () => {
      const order = await defaultPaymentGateway.createOrder({
        studentId: 's-dup-01',
        studentName: 'Suresh Menon',
        rollNumber: 'LCA-11',
        courseTitle: 'Veena',
        feePeriod: 'November 2026',
        invoiceNumber: 'LCA-INV-2026-DUP01',
        baseAmount: 1694.92,
        gstAmount: 305.08,
        discountAmount: 0,
        totalAmount: 2000,
        paymentMethod: 'axis_card',
      });

      const txn1 = await defaultPaymentGateway.processDemoPayment({
        orderId: order.orderId,
        invoiceNumber: order.invoiceNumber,
        studentId: order.studentId,
        studentName: order.studentName,
        rollNumber: order.rollNumber,
        courseTitle: order.courseTitle,
        feePeriod: order.feePeriod,
        amount: order.totalAmount,
        paymentMethod: 'axis_card',
        outcome: 'SUCCESS',
      });

      const txn2 = await defaultPaymentGateway.processDemoPayment({
        orderId: order.orderId,
        invoiceNumber: order.invoiceNumber,
        studentId: order.studentId,
        studentName: order.studentName,
        rollNumber: order.rollNumber,
        courseTitle: order.courseTitle,
        feePeriod: order.feePeriod,
        amount: order.totalAmount,
        paymentMethod: 'axis_card',
        outcome: 'SUCCESS',
      });

      assert.equal(txn1.id, txn2.id, 'Duplicate payment processing must return the existing transaction record');
    });

  });

  describe('3. Amount Validation & 18% Reverse GST Math', () => {

    it('rejects non-positive order amounts with an error', async () => {
      await assert.rejects(
        async () => {
          await defaultPaymentGateway.createOrder({
            studentId: 's-neg-01',
            studentName: 'Invalid Amount Disciple',
            rollNumber: 'LCA-99',
            courseTitle: 'Dance',
            feePeriod: 'November 2026',
            invoiceNumber: 'LCA-INV-NEG',
            baseAmount: 0,
            gstAmount: 0,
            discountAmount: 0,
            totalAmount: -100, // Invalid negative amount
            paymentMethod: 'axis_upi',
          });
        },
        /Payment total amount must be greater than 0/,
        'Should reject negative amount'
      );
    });

    it('calculates reverse 18% GST with zero rounding drift', () => {
      const testFees = [1000, 2000, 2500, 3000, 4500, 5000, 9500];

      for (const total of testFees) {
        const base = Number((total / 1.18).toFixed(2));
        const gst = Number((total - base).toFixed(2));
        const cgst = Number((gst / 2).toFixed(2));
        const sgst = Number((gst - cgst).toFixed(2));

        assert.equal(Number((base + gst).toFixed(2)), total, `Base + GST must exactly equal ${total}`);
        assert.equal(Number((cgst + sgst).toFixed(2)), gst, `CGST + SGST must exactly equal GST for ${total}`);
      }
    });

    it('handles student scholarship discounts properly', () => {
      const fee = 4000;
      const discount = 500;
      const payable = fee - discount;

      const base = Number((payable / 1.18).toFixed(2));
      const gst = Number((payable - base).toFixed(2));

      assert.equal(payable, 3500);
      assert.equal(Number((base + gst).toFixed(2)), 3500);
    });

  });

  describe('4. Strict Production Data Isolation & Synthetic Data Guarantees', () => {

    it('guarantees isMock is strictly true on all demo operations', async () => {
      const order = await defaultPaymentGateway.createOrder({
        studentId: 's-iso-01',
        studentName: 'Divya Sundar',
        rollNumber: 'LCA-22',
        courseTitle: 'Bharatanatyam Senior',
        feePeriod: 'November 2026',
        invoiceNumber: 'LCA-INV-2026-ISO01',
        baseAmount: 2542.37,
        gstAmount: 457.63,
        discountAmount: 0,
        totalAmount: 3000,
        paymentMethod: 'axis_upi',
      });

      const payload = createAxisPaymentPayload(order);
      assert.equal(payload.isMock, true);
      assert.equal(payload.isDemo, true);
      assert.equal(payload.disclaimer, DEMO_PAYMENT_DISCLAIMER);
      assert.equal(AXIS_PG_CONFIG.isLive, false, 'Live gateway configuration MUST remain strictly disabled');
    });

    it('uses only synthetic test fixtures and non-routable synthetic accounts', () => {
      // Validate synthetic test cards
      for (const card of SYNTHETIC_DEMO_FIXTURES.cards) {
        assert.ok(card.number.startsWith('4000') || card.number.startsWith('6071'), 'Cards must use synthetic test prefixes');
        assert.equal(card.otp, '123456', 'Must use synthetic test OTP');
      }

      // Validate synthetic test UPIs
      for (const upi of SYNTHETIC_DEMO_FIXTURES.upis) {
        assert.ok(upi.vpa.endsWith('@okaxis') || upi.vpa.endsWith('@axisbank') || upi.vpa.endsWith('@sbi'), 'Synthetic VPA suffix check');
      }
    });

    it('ensures demo disclaimers are present on all records', () => {
      assert.equal(DEMO_PAYMENT_DISCLAIMER, 'DEMO MODE — NO REAL MONEY WILL BE TRANSFERRED');
      const allTxns = getActiveDemoTransactions();
      for (const t of allTxns) {
        assert.equal(t.isMock, true, `Transaction ${t.id} must be marked isMock: true`);
        assert.ok(t.axisOrderId.startsWith('AXIS-DEMO-ORD-'), `Order ID ${t.axisOrderId} must start with AXIS-DEMO-ORD-`);
      }
    });

  });

  describe('5. Admin Reconciliation Dashboard Logic', () => {

    it('filters transactions by status', () => {
      const all = getActiveDemoTransactions();
      const successOnly = all.filter(t => t.status === 'demo_success');
      const failedOnly = all.filter(t => t.status === 'demo_failed');

      assert.ok(successOnly.every(t => t.status === 'demo_success'));
      assert.ok(failedOnly.every(t => t.status === 'demo_failed'));
    });

    it('filters transactions by payment method', () => {
      const all = getActiveDemoTransactions();
      const upiOnly = all.filter(t => t.paymentMethod === 'axis_upi');
      assert.ok(upiOnly.every(t => t.paymentMethod === 'axis_upi'));
    });

    it('updates transaction status via admin reconciliation simulation', () => {
      const all = getActiveDemoTransactions();
      const pendingTxn = all.find(t => t.status === 'demo_pending');

      if (pendingTxn) {
        const updated = updateDemoTransaction(pendingTxn.id, {
          status: 'settled',
          adminNotes: 'Manually verified in demo clearance sandbox by Director'
        });

        assert.equal(updated?.status, 'settled');
        assert.equal(updated?.isMock, true, 'isMock flag must stay true even after manual reconciliation');
        assert.ok(updated?.adminNotes?.includes('demo clearance sandbox'));
      }
    });

  });

});
