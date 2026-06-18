CREATE TABLE `painting` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt` text NOT NULL,
	`negative_prompt` text DEFAULT '' NOT NULL,
	`image_data` text NOT NULL,
	`width` integer DEFAULT 1024 NOT NULL,
	`height` integer DEFAULT 1024 NOT NULL,
	`model_name` text NOT NULL,
	`provider_id` text NOT NULL,
	`created_at` integer NOT NULL
);
