import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const payees = mysqlTable("payees", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 40 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  color: varchar("color", { length: 24 }).default("teal").notNull(),
});

export const recurringBills = mysqlTable("recurringBills", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  billName: varchar("billName", { length: 160 }).notNull(),
  payeeId: int("payeeId").notNull(),
  categoryId: int("categoryId").notNull(),
  amountCents: int("amountCents").notNull(),
  currency: varchar("currency", { length: 3 }).default("LKR").notNull(),
  dueDay: int("dueDay").notNull(),
  frequency: mysqlEnum("frequency", ["monthly", "quarterly", "yearly"]).notNull(),
  reminderDays: int("reminderDays").default(3).notNull(),
  active: int("active").default(1).notNull(),
  stopFromMonth: varchar("stopFromMonth", { length: 7 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const bills = mysqlTable("bills", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  billName: varchar("billName", { length: 160 }).notNull(),
  payeeId: int("payeeId").notNull(),
  categoryId: int("categoryId").notNull(),
  amountCents: int("amountCents").notNull(),
  currency: varchar("currency", { length: 3 }).default("LKR").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  billingMonth: varchar("billingMonth", { length: 7 }).notNull(),
  recurringBillId: int("recurringBillId"),
  reminderEnabled: int("reminderEnabled").default(1).notNull(),
  reminderDays: int("reminderDays").default(3).notNull(),
  notes: text("notes"),
  invoiceNumber: varchar("invoiceNumber", { length: 120 }),
  attachmentUrl: text("attachmentUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  billId: int("billId").notNull(),
  amountCents: int("amountCents").notNull(),
  paymentDate: timestamp("paymentDate").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "bank_transfer", "credit_card", "debit_card", "online_payment", "other"]).notNull(),
  referenceNumber: varchar("referenceNumber", { length: 120 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const reminders = mysqlTable("reminders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  billId: int("billId").notNull(),
  reminderType: mysqlEnum("reminderType", ["before_due", "due_today", "overdue", "repeat_overdue"]).notNull(),
  reminderDate: timestamp("reminderDate").notNull(),
  sentAt: timestamp("sentAt"),
  status: mysqlEnum("status", ["scheduled", "sent", "cancelled"]).default("scheduled").notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  billId: int("billId"),
  title: varchar("title", { length: 180 }).notNull(),
  message: text("message").notNull(),
  read: int("read").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Bill = typeof bills.$inferSelect;
export type InsertBill = typeof bills.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type Payee = typeof payees.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type RecurringBill = typeof recurringBills.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
