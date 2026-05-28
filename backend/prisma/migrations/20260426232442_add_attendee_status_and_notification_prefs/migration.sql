-- AlterTable
ALTER TABLE `event_attendees` ADD COLUMN `respondedAt` DATETIME(3) NULL,
    ADD COLUMN `status` ENUM('PENDING', 'GOING', 'MAYBE', 'DECLINED') NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE `notification_preferences` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `type` ENUM('NEWS', 'POLL', 'MESSAGE', 'SYSTEM', 'LEAVE', 'TASK', 'EXPENSE', 'SUGGESTION', 'CELEBRATION', 'MENTION', 'TRAINING', 'CALENDAR') NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,

    INDEX `notification_preferences_userId_idx`(`userId`),
    UNIQUE INDEX `notification_preferences_userId_type_key`(`userId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notification_preferences` ADD CONSTRAINT `notification_preferences_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
