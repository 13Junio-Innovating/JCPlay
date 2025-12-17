CREATE DATABASE IF NOT EXISTS `JC-Vision-Play`;
USE `JC-Vision-Play`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255),
  `avatar_url` VARCHAR(255),
  `reset_token` VARCHAR(255),
  `reset_expires` DATETIME,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `screens` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `assigned_playlist` VARCHAR(36),
  `player_key` VARCHAR(255),
  `last_seen` DATETIME,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `playlists` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `items` LONGTEXT, -- Stores JSON array of playlist items
  `created_by` VARCHAR(36) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `media` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `url` VARCHAR(255) NOT NULL,
  `type` VARCHAR(50),
  `duration` INT DEFAULT 10,
  `size` INT,
  `uploaded_by` VARCHAR(36) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `user_activity_logs` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36),
  `action` VARCHAR(255) NOT NULL,
  `resource` VARCHAR(255),
  `resource_id` VARCHAR(255),
  `details` LONGTEXT, -- Stores JSON details
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `error_logs` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36),
  `error_type` VARCHAR(255),
  `error_message` TEXT,
  `severity` VARCHAR(50),
  `context` LONGTEXT, -- Stores JSON context
  `resolved` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
