ALTER TABLE `user_alerts` ADD `targetValue` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `user_alerts` ADD `isRecurring` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_alerts` DROP COLUMN `threshold`;