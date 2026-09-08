import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getBillsForUser, getCategoriesForUser, getDb, getNotificationsForUser, getPayeesForUser, getPaymentsForUser } from "./db";
import { bills, categories, notifications, payees, payments, recurringBills } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";

const billInput = z.object({
  billName: z.string().min(1).max(160), payeeId: z.number().int().positive(), categoryId: z.number().int().positive(),
  amountCents: z.number().int().nonnegative(), currency: z.string().length(3).default("LKR"), dueDate: z.coerce.date(),
  billingMonth: z.string().regex(/^\d{4}-\d{2}$/), recurringBillId: z.number().int().positive().nullable().optional(),
  reminderEnabled: z.boolean().default(true), reminderDays: z.number().int().min(0).max(90).default(3), notes: z.string().max(5000).nullable().optional(), invoiceNumber: z.string().max(120).nullable().optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  bills: router({
    list: protectedProcedure.input(z.object({ billingMonth: z.string().regex(/^\d{4}-\d{2}$/).optional() }).optional()).query(async ({ ctx, input }) => {
      const rows = await getBillsForUser(ctx.user.id, input?.billingMonth);
      const allPayments = await getPaymentsForUser(ctx.user.id);
      const today = new Date();
      return rows.map(bill => {
        const paidCents = allPayments.filter(p => p.billId === bill.id).reduce((sum, p) => sum + p.amountCents, 0);
        const days = Math.ceil((bill.dueDate.getTime() - today.getTime()) / 86400000);
        const status = paidCents >= bill.amountCents ? "paid" : days < 0 ? "overdue" : days <= bill.reminderDays ? "due_soon" : "unpaid";
        return { ...bill, paidCents, remainingCents: Math.max(bill.amountCents - paidCents, 0), status };
      });
    }),
    create: protectedProcedure.input(billInput).mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const [created] = await db.insert(bills).values({ ...input, userId: ctx.user.id, reminderEnabled: input.reminderEnabled ? 1 : 0, recurringBillId: input.recurringBillId ?? null }).$returningId();
      return created;
    }),
    update: protectedProcedure.input(billInput.extend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const { id, ...values } = input;
      await db.update(bills).set({ ...values, reminderEnabled: values.reminderEnabled ? 1 : 0, recurringBillId: values.recurringBillId ?? null }).where(and(eq(bills.id, id), eq(bills.userId, ctx.user.id)));
      return { success: true };
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      await db.delete(bills).where(and(eq(bills.id, input.id), eq(bills.userId, ctx.user.id))); return { success: true };
    }),
    addPayment: protectedProcedure.input(z.object({ billId: z.number().int().positive(), amountCents: z.number().int().positive(), paymentDate: z.coerce.date(), paymentMethod: z.enum(["cash", "bank_transfer", "credit_card", "debit_card", "online_payment", "other"]), referenceNumber: z.string().max(120).nullable().optional(), notes: z.string().max(5000).nullable().optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const ownBill = await db.select().from(bills).where(and(eq(bills.id, input.billId), eq(bills.userId, ctx.user.id))).limit(1); if (!ownBill[0]) throw new Error("Bill not found");
      await db.insert(payments).values({ ...input, userId: ctx.user.id, referenceNumber: input.referenceNumber ?? null, notes: input.notes ?? null }); return { success: true };
    }),
  }),
  dashboard: router({
    overview: protectedProcedure.input(z.object({ billingMonth: z.string().regex(/^\d{4}-\d{2}$/) })).query(async ({ ctx, input }) => {
      const rows = await getBillsForUser(ctx.user.id, input.billingMonth); const allPayments = await getPaymentsForUser(ctx.user.id); const today = new Date();
      const paymentsByBill = new Map<number, number>(); allPayments.forEach(p => paymentsByBill.set(p.billId, (paymentsByBill.get(p.billId) ?? 0) + p.amountCents));
      const totalCents = rows.reduce((s, b) => s + b.amountCents, 0); const paidCents = rows.reduce((s, b) => s + Math.min(paymentsByBill.get(b.id) ?? 0, b.amountCents), 0);
      const overdueCents = rows.filter(b => (paymentsByBill.get(b.id) ?? 0) < b.amountCents && b.dueDate < today).reduce((s, b) => s + b.amountCents - (paymentsByBill.get(b.id) ?? 0), 0);
      const upcoming = rows.filter(b => (paymentsByBill.get(b.id) ?? 0) < b.amountCents && b.dueDate >= today && b.dueDate.getTime() - today.getTime() < 7 * 86400000).length;
      return { totalBills: rows.length, totalCents, paidCents, unpaidCents: Math.max(totalCents - paidCents, 0), overdueCents, overdueBills: rows.filter(b => b.dueDate < today && (paymentsByBill.get(b.id) ?? 0) < b.amountCents).length, upcomingBills: upcoming };
    }),
  }),
  payees: router({ list: protectedProcedure.query(({ ctx }) => getPayeesForUser(ctx.user.id)), create: protectedProcedure.input(z.object({ name: z.string().min(1).max(160) })).mutation(async ({ ctx, input }) => { const db = await getDb(); if (!db) throw new Error("Database unavailable"); return db.insert(payees).values({ userId: ctx.user.id, name: input.name }); }) }),
  categories: router({ list: protectedProcedure.query(({ ctx }) => getCategoriesForUser(ctx.user.id)), create: protectedProcedure.input(z.object({ name: z.string().min(1).max(80), color: z.string().max(24).default("teal") })).mutation(async ({ ctx, input }) => { const db = await getDb(); if (!db) throw new Error("Database unavailable"); return db.insert(categories).values({ userId: ctx.user.id, name: input.name, color: input.color }); }) }),
  recurring: router({ list: protectedProcedure.query(async ({ ctx }) => { const db = await getDb(); if (!db) return []; return db.select().from(recurringBills).where(eq(recurringBills.userId, ctx.user.id)); }) }),
  notifications: router({ list: protectedProcedure.query(({ ctx }) => getNotificationsForUser(ctx.user.id)), markRead: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(notifications).set({ read: 1 }).where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id))); return { success: true }; }) }),
});

export type AppRouter = typeof appRouter;
