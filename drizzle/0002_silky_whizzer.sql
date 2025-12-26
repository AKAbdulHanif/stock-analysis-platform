CREATE TABLE `benchmark_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticker` varchar(10) NOT NULL,
	`date` timestamp NOT NULL,
	`closePrice` varchar(20) NOT NULL,
	`dailyReturn` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `benchmark_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolio_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`watchlistId` int NOT NULL,
	`date` timestamp NOT NULL,
	`totalValue` varchar(20) NOT NULL,
	`dailyReturn` varchar(20),
	`cumulativeReturn` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portfolio_snapshots_id` PRIMARY KEY(`id`)
);
