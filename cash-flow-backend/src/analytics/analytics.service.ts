import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(preset?: string, startDateStr?: string, endDateStr?: string) {
    const clientsCount = await this.prisma.client.count();

    // Construimos el filtro de fechas dinámico para Prisma
    const dateFilter: any = {};
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (preset && preset !== 'all') {
      if (preset === 'today') {
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        dateFilter.createdAt = {
          gte: now,
          lte: endOfDay,
        };
      } else if (preset === 'week') {
        const firstDayOfWeek = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Ajuste a Lunes
        firstDayOfWeek.setDate(diff);
        firstDayOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(now);
        endOfWeek.setHours(23, 59, 59, 999);

        dateFilter.createdAt = {
          gte: firstDayOfWeek,
          lte: endOfWeek,
        };
      } else if (preset === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        dateFilter.createdAt = {
          gte: startOfMonth,
          lte: endOfMonth,
        };
      }
    } else if (startDateStr && endDateStr) {
      const start = new Date(startDateStr);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDateStr);
      end.setHours(23, 59, 59, 999);

      dateFilter.createdAt = {
        gte: start,
        lte: end,
      };
    }

    // Consultamos los préstamos aplicando el filtro de fecha en la BD
    const loans = await this.prisma.loan.findMany({
      where: dateFilter,
      include: { payments: true },
    });

    const cashMovements = await this.prisma.cashMovement.findMany();

    // Contadores generales
    const totalLoansCount = loans.length;
    const activeLoansCount = loans.filter((l) => l.status === 'ACTIVO').length;
    const paidLoansCount = loans.filter((l) => l.status === 'PAGADO').length;

    let totalLentAmount = 0;
    let totalExpectedReturn = 0;
    let totalCollected = 0;

    loans.forEach((loan) => {
      if (loan.status === 'REFINANCIADO') {
        return;
      }

      totalLentAmount += loan.amount;
      totalExpectedReturn += loan.totalToPay;
      
      loan.payments.forEach((p) => {
        totalCollected += p.amount;
      });
    });

    // Calcular balance de caja global
    let cashBalance = 0;
    cashMovements.forEach((m) => {
      if (m.type === 'INGRESO') cashBalance += m.amount;
      if (m.type === 'EGRESO') cashBalance -= m.amount;
    });

    return {
      clientsCount,
      totalLoansCount,
      activeLoansCount,
      paidLoansCount,
      totalLentAmount,
      totalExpectedReturn,
      totalCollected,
      cashBalance,
      loans, // Enviamos la lista para que el frontend pueda procesar si lo requiere
    };
  }
}