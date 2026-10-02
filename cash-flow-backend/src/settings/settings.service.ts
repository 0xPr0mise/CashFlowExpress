import { Injectable, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.setting.findMany();
  }

  async upsert(key: string, value: string) {
    return this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  downloadBackup(res: Response) {
    // Ruta hacia tu archivo de SQLite especificado en el schema.prisma
    const dbPath = path.resolve(process.cwd(), 'prisma/dev.db');

    if (!fs.existsSync(dbPath)) {
      throw new NotFoundException('No se encontró el archivo de la base de datos.');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `cashflow-backup-${timestamp}.sqlite`;

    return res.download(dbPath, fileName, (err) => {
      if (err) {
        console.error('Error al descargar el backup:', err);
      }
    });
  }
}