-- AlterTable
ALTER TABLE `notifications` MODIFY `type` ENUM('NEWS', 'POLL', 'MESSAGE', 'SYSTEM', 'LEAVE', 'TASK', 'EXPENSE', 'SUGGESTION', 'CELEBRATION', 'MENTION', 'TRAINING', 'CALENDAR') NOT NULL;

-- CreateTable
CREATE TABLE `news_views` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `newsId` INTEGER NOT NULL,
    `viewedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `news_views_newsId_idx`(`newsId`),
    UNIQUE INDEX `news_views_userId_newsId_key`(`userId`, `newsId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_views` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `trainingId` INTEGER NOT NULL,
    `viewedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `training_views_trainingId_idx`(`trainingId`),
    UNIQUE INDEX `training_views_userId_trainingId_key`(`userId`, `trainingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `news_views` ADD CONSTRAINT `news_views_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `news_views` ADD CONSTRAINT `news_views_newsId_fkey` FOREIGN KEY (`newsId`) REFERENCES `news`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_views` ADD CONSTRAINT `training_views_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_views` ADD CONSTRAINT `training_views_trainingId_fkey` FOREIGN KEY (`trainingId`) REFERENCES `trainings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
