CREATE TABLE `game_history` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`round_number` integer NOT NULL,
	`data` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `id` ON `game_history` (`id`);--> statement-breakpoint
CREATE INDEX `roomId` ON `game_history` (`room_id`);--> statement-breakpoint
CREATE INDEX `roomId_createdAt` ON `game_history` (`room_id`,`created_at`);