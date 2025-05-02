CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`seats` integer NOT NULL,
	`is_private` integer DEFAULT false NOT NULL,
	`started` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rooms_id` ON `rooms` (`id`);--> statement-breakpoint
CREATE INDEX `rooms_userId` ON `rooms` (`user_id`);--> statement-breakpoint
CREATE INDEX `rooms_started` ON `rooms` (`started`);--> statement-breakpoint
CREATE INDEX `rooms_seats` ON `rooms` (`seats`);--> statement-breakpoint
DROP INDEX `id`;--> statement-breakpoint
DROP INDEX `roomId`;--> statement-breakpoint
DROP INDEX `roomId_createdAt`;--> statement-breakpoint
ALTER TABLE `game_history` ADD `user_id` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `game_history_id` ON `game_history` (`id`);--> statement-breakpoint
CREATE INDEX `game_history_userId` ON `game_history` (`user_id`);--> statement-breakpoint
CREATE INDEX `game_history_roomId` ON `game_history` (`room_id`);--> statement-breakpoint
CREATE INDEX `game_history_roomId_createdAt` ON `game_history` (`room_id`,`created_at`);--> statement-breakpoint
DROP INDEX `userId`;--> statement-breakpoint
DROP INDEX `city`;--> statement-breakpoint
DROP INDEX `county`;--> statement-breakpoint
DROP INDEX `createdAt`;--> statement-breakpoint
CREATE UNIQUE INDEX `user_profile_userId` ON `user_profile` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_profile_city` ON `user_profile` (`city`);--> statement-breakpoint
CREATE INDEX `user_profile_county` ON `user_profile` (`county`);--> statement-breakpoint
CREATE INDEX `user_profile_createdAt` ON `user_profile` (`created_at`);