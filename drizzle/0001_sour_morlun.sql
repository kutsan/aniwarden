CREATE TABLE `fansub_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`anime_id` integer NOT NULL,
	`group_name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fansub_groups_anime_id_unique` ON `fansub_groups` (`anime_id`);