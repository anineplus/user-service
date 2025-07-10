/*
  Warnings:

  - You are about to drop the column `userId` on the `UserStats` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserStats" DROP CONSTRAINT "UserStats_userId_fkey";

-- DropIndex
DROP INDEX "UserStats_userId_key";

-- AlterTable
ALTER TABLE "UserStats" DROP COLUMN "userId";
