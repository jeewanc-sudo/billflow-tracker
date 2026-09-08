export type BillStatus = "paid" | "unpaid" | "due_soon" | "overdue";
export type LogicBill = { amountCents: number; paidCents: number; dueDate: Date; reminderDays: number };

export function calculateBillStatus(bill: LogicBill, today = new Date()): BillStatus {
  if (bill.paidCents >= bill.amountCents) return "paid";
  if (bill.dueDate.getTime() < today.getTime()) return "overdue";
  const daysUntilDue = Math.ceil((bill.dueDate.getTime() - today.getTime()) / 86400000);
  if (daysUntilDue <= bill.reminderDays) return "due_soon";
  return "unpaid";
}

export function calculateSummary(bills: LogicBill[], today = new Date()) {
  const totalCents = bills.reduce((sum, bill) => sum + bill.amountCents, 0);
  const paidCents = bills.reduce((sum, bill) => sum + Math.min(bill.amountCents, bill.paidCents), 0);
  const unpaidCents = Math.max(totalCents - paidCents, 0);
  const overdueBills = bills.filter(bill => calculateBillStatus(bill, today) === "overdue");
  const upcomingBills = bills.filter(bill => calculateBillStatus(bill, today) === "due_soon");
  const overdueCents = overdueBills.reduce((sum, bill) => sum + Math.max(bill.amountCents - bill.paidCents, 0), 0);
  return { totalCents, paidCents, unpaidCents, overdueCents, overdueBills: overdueBills.length, upcomingBills: upcomingBills.length };
}
