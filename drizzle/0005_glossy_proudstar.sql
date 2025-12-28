ALTER TABLE `portfolio_snapshots` ADD `portfolioId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `portfolio_snapshots` ADD `totalReturn` varchar(20);--> statement-breakpoint
ALTER TABLE `portfolio_snapshots` ADD `totalReturnPercent` varchar(20);--> statement-breakpoint
ALTER TABLE `portfolio_snapshots` ADD `positionsJson` text;--> statement-breakpoint
ALTER TABLE `portfolio_snapshots` DROP COLUMN `watchlistId`;--> statement-breakpoint
ALTER TABLE `portfolio_snapshots` DROP COLUMN `dailyReturn`;--> statement-breakpoint
ALTER TABLE `portfolio_snapshots` DROP COLUMN `cumulativeReturn`;