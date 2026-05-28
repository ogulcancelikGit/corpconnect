-- AlterTable
ALTER TABLE `conversations` ADD COLUMN `archivedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `messages` ADD COLUMN `forwardedFromId` INTEGER NULL,
    ADD COLUMN `pinnedAt` DATETIME(3) NULL,
    ADD COLUMN `pinnedBy` INTEGER NULL;

-- CreateIndex
CREATE INDEX `messages_pinnedAt_idx` ON `messages`(`pinnedAt`);

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_forwardedFromId_fkey` FOREIGN KEY (`forwardedFromId`) REFERENCES `messages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_pinnedBy_fkey` FOREIGN KEY (`pinnedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
