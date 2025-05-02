DROP INDEX `game_history_userId`;--> statement-breakpoint
DROP INDEX `game_history_roomId`;--> statement-breakpoint
DROP INDEX `game_history_roomId_createdAt`;--> statement-breakpoint
CREATE INDEX `game_history_user_id` ON `game_history` (`user_id`);--> statement-breakpoint
CREATE INDEX `game_history_room_id` ON `game_history` (`room_id`);--> statement-breakpoint
CREATE INDEX `game_history_room_id_created_at` ON `game_history` (`room_id`,`created_at`);--> statement-breakpoint
DROP INDEX `rooms_userId`;--> statement-breakpoint
DROP INDEX `rooms_started`;--> statement-breakpoint
CREATE INDEX `rooms_user_id` ON `rooms` (`user_id`);--> statement-breakpoint
CREATE INDEX `rooms_is_started` ON `rooms` (`started`);--> statement-breakpoint
DROP INDEX `user_profile_userId`;--> statement-breakpoint
DROP INDEX `user_profile_createdAt`;--> statement-breakpoint
CREATE UNIQUE INDEX `user_profile_user_id` ON `user_profile` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_profile_created_at` ON `user_profile` (`created_at`);