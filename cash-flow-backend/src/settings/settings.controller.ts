import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @Post()
  updateSetting(@Body() body: { key: string; value: string }) {
    return this.settingsService.upsert(body.key, body.value);
  }

  // NUEVO: Endpoint para descargar la base de datos SQLite
  @Get('backup/download')
  downloadBackup(@Res() res: Response) {
    return this.settingsService.downloadBackup(res);
  }
}