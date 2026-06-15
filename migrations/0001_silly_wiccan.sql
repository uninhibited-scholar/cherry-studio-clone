CREATE TABLE `note` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text DEFAULT 'Untitled' NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`folder_id` text,
	`is_pinned` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `translate_history` (
	`id` text PRIMARY KEY NOT NULL,
	`source_text` text NOT NULL,
	`target_text` text NOT NULL,
	`source_lang` text DEFAULT 'auto' NOT NULL,
	`target_lang` text DEFAULT 'en' NOT NULL,
	`provider_id` text,
	`model_id` text,
	`created_at` integer NOT NULL
);
