DROP INDEX `game_history_room_id_created_at`;--> statement-breakpoint
CREATE UNIQUE INDEX `game_history_room_round` ON `game_history` (`room_id`,`round_number`);--> statement-breakpoint
CREATE INDEX `game_history_room_id_created_at` ON `game_history` (`created_at`);