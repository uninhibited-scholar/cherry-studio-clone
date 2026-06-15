CREATE TABLE `user_model` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_id` text NOT NULL,
	`name` text NOT NULL,
	`display_name` text,
	`endpoint_type` text,
	`capabilities` text DEFAULT '[]',
	`context_window` integer,
	`max_output_tokens` integer,
	`is_enabled` integer DEFAULT true NOT NULL,
	`is_custom` integer DEFAULT false NOT NULL,
	`pricing` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_provider` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`api_key` text,
	`api_host` text,
	`default_endpoint_type` text DEFAULT 'openai_chat_completions' NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	`is_builtin` integer DEFAULT false NOT NULL,
	`website` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `assistant` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`emoji` text,
	`description` text,
	`prompt` text DEFAULT '' NOT NULL,
	`model_id` text,
	`provider_id` text,
	`max_tokens` integer,
	`temperature` real DEFAULT 1 NOT NULL,
	`is_builtin` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `topic` (
	`id` text PRIMARY KEY NOT NULL,
	`assistant_id` text NOT NULL,
	`title` text DEFAULT 'New Topic' NOT NULL,
	`is_pinned` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `message` (
	`id` text PRIMARY KEY NOT NULL,
	`topic_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`model_id` text,
	`provider_id` text,
	`usage` text,
	`file_ids` text DEFAULT '[]',
	`thinking_content` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
