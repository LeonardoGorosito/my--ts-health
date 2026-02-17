/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Pet` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Pet" DROP COLUMN "imageUrl",
ADD COLUMN     "bannerImageUrl" TEXT,
ADD COLUMN     "profileImageUrl" TEXT,
ADD COLUMN     "weight" TEXT;
