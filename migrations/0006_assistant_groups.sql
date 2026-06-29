CREATE TABLE `assistant_group` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `assistant` ADD `group_id` text;
