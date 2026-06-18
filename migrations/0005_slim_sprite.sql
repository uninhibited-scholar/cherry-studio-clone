CREATE TABLE `prompt_template` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`content` text NOT NULL,
	`category` text DEFAULT 'General' NOT NULL,
	`created_at` integer NOT NULL
);
