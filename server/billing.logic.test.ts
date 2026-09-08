import { describe, expect, it } from "vitest";
import { calculateBillStatus, calculateSummary } from "./billing.logic";

const today = new Date("2026-09-08T00:00:00Z");

describe("bill status rules", () => {
  it("marks a fully paid bill as paid even after its due date", () => {
    expect(calculateBillStatus({ amountCents: 10000, paidCents: 10000, dueDate: new Date("2026-09-01T00:00:00Z"), reminderDays: 3 }, today)).toBe("paid");
  });
  it("keeps a partially paid bill overdue when its due date has passed", () => {
    expect(calculateBillStatus({ amountCents: 10000, paidCents: 6000, dueDate: new Date("2026-09-07T00:00:00Z"), reminderDays: 3 }, today)).toBe("overdue");
  });
  it("marks an unpaid bill due soon inside its reminder window", () => {
    expect(calculateBillStatus({ amountCents: 10000, paidCents: 0, dueDate: new Date("2026-09-10T00:00:00Z"), reminderDays: 3 }, today)).toBe("due_soon");
  });
  it("keeps a future bill unpaid outside its reminder window", () => {
    expect(calculateBillStatus({ amountCents: 10000, paidCents: 0, dueDate: new Date("2026-09-20T00:00:00Z"), reminderDays: 3 }, today)).toBe("unpaid");
  });
});

describe("dashboard summary", () => {
  it("calculates totals, partial payments, overdue balance, and counts", () => {
    expect(calculateSummary([
      { amountCents: 10000, paidCents: 10000, dueDate: new Date("2026-09-01T00:00:00Z"), reminderDays: 3 },
      { amountCents: 8000, paidCents: 3000, dueDate: new Date("2026-09-07T00:00:00Z"), reminderDays: 3 },
      { amountCents: 5000, paidCents: 0, dueDate: new Date("2026-09-10T00:00:00Z"), reminderDays: 3 },
    ], today)).toEqual({ totalCents: 23000, paidCents: 13000, unpaidCents: 10000, overdueCents: 5000, overdueBills: 1, upcomingBills: 1 });
  });
  it("does not let an overpayment make paid totals exceed the bill total", () => {
    expect(calculateSummary([{ amountCents: 10000, paidCents: 12000, dueDate: new Date("2026-09-20T00:00:00Z"), reminderDays: 3 }], today).paidCents).toBe(10000);
  });
});
