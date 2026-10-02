import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  getStats(
    @Query('preset') preset?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Normalizamos valores vacíos para que el servicio reciba undefined limpio
    const cleanPreset = preset && preset !== 'undefined' && preset !== 'null' ? preset : undefined;
    const cleanStart = startDate && startDate !== 'undefined' && startDate !== 'null' ? startDate : undefined;
    const cleanEnd = endDate && endDate !== 'undefined' && endDate !== 'null' ? endDate : undefined;

    return this.analyticsService.getDashboardStats(cleanPreset, cleanStart, cleanEnd);
  }
}