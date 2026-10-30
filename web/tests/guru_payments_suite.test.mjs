import assert from 'node:assert/strict';
import test from 'node:test';

test('Invoice sequence generator formats', () => {
  function getNextInvoiceNumber(prefix, list) {
    const year = new Date().getFullYear();
    let maxSeq = 0;
    const regex = new RegExp(`^LCA-${prefix}-${year}-(\\d+)$`);
    for (const item of list) {
      if (item.invoice_number) {
        const match = item.invoice_number.match(regex);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    }
    return `LCA-${prefix}-${year}-${maxSeq + 1}`;
  }

  const existingSalaries = [
    { invoice_number: 'LCA-SAL-2026-1' },
    { invoice_number: 'LCA-SAL-2026-2' },
    { invoice_number: 'LCA-SAL-2026-42' },
  ];
  assert.equal(getNextInvoiceNumber('SAL', existingSalaries), 'LCA-SAL-2026-43');

  const existingPayments = [
    { invoice_number: 'LCA-PAY-2026-1' },
  ];
  assert.equal(getNextInvoiceNumber('PAY', existingPayments), 'LCA-PAY-2026-2');

  const emptyList = [];
  assert.equal(getNextInvoiceNumber('PAY', emptyList), 'LCA-PAY-2026-1');
});

test('Salary net payable calculation logic', () => {
  function computeNetSalary({ base_salary, bonus_amount, deduction_amount, advance_deducted }) {
    const base = Number(base_salary || 0);
    const bonus = Number(bonus_amount || 0);
    const deduction = Number(deduction_amount || 0);
    const advance = Number(advance_deducted || 0);
    return base + bonus - deduction - advance;
  }

  const result1 = computeNetSalary({
    base_salary: 30000,
    bonus_amount: 5000,
    deduction_amount: 1000,
    advance_deducted: 4000
  });
  assert.equal(result1, 30000);

  const result2 = computeNetSalary({
    base_salary: 25000,
    bonus_amount: 0,
    deduction_amount: 0,
    advance_deducted: 0
  });
  assert.equal(result2, 25000);
});

test('Guru disbursement distinction badges', () => {
  function getBadgeDetails(record) {
    const isSalary = record.record_kind === 'salary' || record.payment_type === 'monthly_salary';
    if (isSalary) {
      return {
        badge: 'SALARY',
        sourceDescription: '[Admin updated through payroll]',
        category: 'Monthly Salary'
      };
    }
    return {
      badge: 'PAYMENT',
      sourceDescription: `[Added from payments page: ${record.badge_label || 'Direct Payment'}]`,
      category: record.badge_label || 'Direct Payment'
    };
  }

  const salaryItem = {
    record_kind: 'salary',
    payment_type: 'monthly_salary',
    invoice_number: 'LCA-SAL-2026-1',
    amount: 30000
  };
  const salaryBadge = getBadgeDetails(salaryItem);
  assert.equal(salaryBadge.badge, 'SALARY');
  assert.equal(salaryBadge.sourceDescription, '[Admin updated through payroll]');

  const paymentItem = {
    record_kind: 'payment',
    payment_type: 'salary_advance',
    badge_label: 'Salary Advance',
    invoice_number: 'LCA-PAY-2026-1',
    amount: 5000
  };
  const paymentBadge = getBadgeDetails(paymentItem);
  assert.equal(paymentBadge.badge, 'PAYMENT');
  assert.equal(paymentBadge.sourceDescription, '[Added from payments page: Salary Advance]');
});

test('Notification formatting for admin actions', () => {
  function formatSalaryNotification(updated, isPaid) {
    const invNo = updated.invoice_number || 'LCA-SAL-2026';
    const net = Number(updated.net_salary || 0).toLocaleString('en-IN');
    const title = isPaid 
      ? `Salary Disbursed: ₹${net} (${updated.payroll_month})` 
      : `Salary Update: ₹${net} (${updated.payroll_month})`;
    const message = isPaid
      ? `Namaste ${updated.guru_name || 'Guru'} ji, your salary honorarium for ${updated.payroll_month} has been disbursed under Invoice ${invNo}.`
      : `Namaste ${updated.guru_name || 'Guru'} ji, your payroll honorarium details for ${updated.payroll_month} have been updated by admin.`;
    return { title, message };
  }

  const notifPaid = formatSalaryNotification({
    invoice_number: 'LCA-SAL-2026-5',
    net_salary: 35000,
    payroll_month: 'October 2026',
    guru_name: 'Dr. Shanmukha Rao'
  }, true);

  assert.equal(notifPaid.title, 'Salary Disbursed: ₹35,000 (October 2026)');
  assert.ok(notifPaid.message.includes('LCA-SAL-2026-5'));

  const notifUpdate = formatSalaryNotification({
    invoice_number: 'LCA-SAL-2026-5',
    net_salary: 32000,
    payroll_month: 'November 2026',
    guru_name: 'Dr. Shanmukha Rao'
  }, false);

  assert.equal(notifUpdate.title, 'Salary Update: ₹32,000 (November 2026)');
});
