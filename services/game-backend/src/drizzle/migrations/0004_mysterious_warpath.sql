ALTER TABLE `rooms` RENAME COLUMN "started" TO "is_started";--> statement-breakpoint
DROP INDEX `rooms_is_started`;--> statement-breakpoint
CREATE INDEX `rooms_is_started` ON `rooms` (`is_started`);