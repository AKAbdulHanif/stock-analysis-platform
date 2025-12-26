CREATE TABLE `alert_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertId` int NOT NULL,
	`userId` int NOT NULL,
	`ticker` varchar(10) NOT NULL,
	`message` text NOT NULL,
	`isRead` int NOT NULL DEFAULT 0,
	`triggeredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alert_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sentiment_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticker` varchar(10) NOT NULL,
	`date` timestamp NOT NULL,
	`sentimentScore` varchar(20) NOT NULL,
	`sentimentType` enum('positive','negative','neutral') NOT NULL,
	`confidence` varchar(20) NOT NULL,
	`articleCount` int NOT NULL,
	`avgScore7d` varchar(20),
	`avgScore30d` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sentiment_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ticker` varchar(10) NOT NULL,
	`alertType` enum('price_above','price_below','sentiment_positive','sentiment_negative','sentiment_change') NOT NULL,
	`threshold` varchar(50),
	`isActive` int NOT NULL DEFAULT 1,
	`lastTriggered` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `watchlist_stocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`watchlistId` int NOT NULL,
	`ticker` varchar(10) NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `watchlist_stocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `watchlists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `watchlists_id` PRIMARY KEY(`id`)
);
