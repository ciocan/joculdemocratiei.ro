ALTER TABLE `user_profile` ADD `county_code` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profile` ADD `lat` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profile` ADD `lon` real DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `user_profile_county_code` ON `user_profile` (`county_code`);