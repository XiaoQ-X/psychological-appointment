ALTER TABLE `students`
  ADD COLUMN `must_change_password` BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE `counselors`
  ADD COLUMN `must_change_password` BOOLEAN NOT NULL DEFAULT true;
