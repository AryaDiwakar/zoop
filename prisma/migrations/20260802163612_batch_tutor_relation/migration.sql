-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
