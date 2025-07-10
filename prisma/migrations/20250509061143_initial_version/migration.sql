/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `UserStats` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `UserStats` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserStats" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserStats_userId_key" ON "UserStats"("userId");

-- AddForeignKey
ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
