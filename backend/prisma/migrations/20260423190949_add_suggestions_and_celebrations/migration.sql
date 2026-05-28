-- AlterTable
ALTER TABLE `notifications` MODIFY `type` ENUM('NEWS', 'POLL', 'MESSAGE', 'SYSTEM', 'LEAVE', 'TASK', 'EXPENSE', 'SUGGESTION', 'CELEBRATION') NOT NULL;

-- AlterTable
ALTER TABLE `user_profiles` ADD COLUMN `birthDate` DATETIME(3) NULL,
    ADD COLUMN `hireDate` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `suggestions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `category` ENUM('PROCESS', 'TECHNOLOGY', 'CULTURE', 'SAFETY', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `status` ENUM('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `adminNote` VARCHAR(500) NULL,
    `reviewedBy` INTEGER NULL,
    `reviewedAt` DATETIME(3) NULL,
    `isAnonymous` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `suggestions_userId_idx`(`userId`),
    INDEX `suggestions_status_idx`(`status`),
    INDEX `suggestions_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `suggestions` ADD CONSTRAINT `suggestions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
