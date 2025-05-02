CREATE TABLE `user_profile` (
	`user_id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`city` text NOT NULL,
	`county` text NOT NULL,
	`secret_key` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `userId` ON `user_profile` (`user_id`);--> statement-breakpoint
CREATE INDEX `city` ON `user_profile` (`city`);--> statement-breakpoint
CREATE INDEX `county` ON `user_profile` (`county`);--> statement-breakpoint
CREATE INDEX `createdAt` ON `user_profile` (`created_at`);