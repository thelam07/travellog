// server/src/reports/reports.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from './schemas/report.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Report.name, schema: ReportSchema }])],
  exports: [MongooseModule],
})
export class ReportsModule {}