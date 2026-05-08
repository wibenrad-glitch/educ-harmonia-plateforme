-- AlterTable: add unique constraint on Class(name, year)
CREATE UNIQUE INDEX "Class_name_year_key" ON "Class"("name", "year");
