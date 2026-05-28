-- AlterTable
ALTER TABLE `notifications` MODIFY `type` ENUM('NEWS', 'POLL', 'MESSAGE', 'SYSTEM', 'LEAVE', 'TASK', 'EXPENSE') NOT NULL;
