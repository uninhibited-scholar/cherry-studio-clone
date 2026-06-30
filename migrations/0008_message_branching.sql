ALTER TABLE `message` ADD `parent_id` text;
ALTER TABLE `message` ADD `branch_index` integer DEFAULT 0 NOT NULL;
