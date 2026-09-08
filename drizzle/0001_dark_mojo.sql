CREATE TABLE `bills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`billName` varchar(160) NOT NULL,
	`payeeId` int NOT NULL,
	`categoryId` int NOT NULL,
	`amountCents` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'LKR',
	`dueDate` timestamp NOT NULL,
	`billingMonth` varchar(7) NOT NULL,
	`recurringBillId` int,
	`reminderEnabled` int NOT NULL DEFAULT 1,
	`reminderDays` int NOT NULL DEFAULT 3,
	`notes` text,
	`invoiceNumber` varchar(120),
	`attachmentUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(80) NOT NULL,
	`color` varchar(24) NOT NULL DEFAULT 'teal',
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`billId` int,
	`title` varchar(180) NOT NULL,
	`message` text NOT NULL,
	`read` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`email` varchar(320),
	`phone` varchar(40),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`billId` int NOT NULL,
	`amountCents` int NOT NULL,
	`paymentDate` timestamp NOT NULL,
	`paymentMethod` enum('cash','bank_transfer','credit_card','debit_card','online_payment','other') NOT NULL,
	`referenceNumber` varchar(120),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recurringBills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`billName` varchar(160) NOT NULL,
	`payeeId` int NOT NULL,
	`categoryId` int NOT NULL,
	`amountCents` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'LKR',
	`dueDay` int NOT NULL,
	`frequency` enum('monthly','quarterly','yearly') NOT NULL,
	`reminderDays` int NOT NULL DEFAULT 3,
	`active` int NOT NULL DEFAULT 1,
	`stopFromMonth` varchar(7),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recurringBills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`billId` int NOT NULL,
	`reminderType` enum('before_due','due_today','overdue','repeat_overdue') NOT NULL,
	`reminderDate` timestamp NOT NULL,
	`sentAt` timestamp,
	`status` enum('scheduled','sent','cancelled') NOT NULL DEFAULT 'scheduled',
	CONSTRAINT `reminders_id` PRIMARY KEY(`id`)
);
