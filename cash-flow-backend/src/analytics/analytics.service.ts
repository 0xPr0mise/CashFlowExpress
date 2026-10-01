import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(preset?: string, startDateStr?: string, endDateStr?: string) {
    const dateFilter: any = {};
    const now = new Date();

    if (preset && preset !== 'all' && preset !== 'undefined' && preset !== 'null') {
      if (preset === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        dateFilter.gte = startOfDay;
        dateFilter.lte = endOfDay;
      } else if (preset === 'week') {
        const firstDayOfWeek = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Lunes
        firstDayOfWeek.setDate(diff);
        firstDayOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(firstDayOfWeek);
        endOfWeek.setDate(firstDayOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        dateFilter.gte = firstDayOfWeek;
        dateFilter.lte = endOfWeek;
      } else if (preset === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        dateFilter.gte = startOfMonth;
        dateFilter.lte = endOfMonth;
      }
    } else if (startDateStr && endDateStr && startDateStr !== 'undefined' && endDateStr !== 'undefined' && startDateStr !== 'null' && endDateStr !== 'null') {
      const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
      const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);

      const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
      const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
      dateFilter.gte = start;
      dateFilter.lte = end;
    }

    const hasDateFilter = Object.keys(dateFilter).length > 0;

    // REGLA DE NEGOCIO: 
    // - Si hay filtro de fecha activo, filtramos por 'dueDate' (lo que vence en el período).
    // - Si no hay filtro ('all'), traemos todo el histórico de préstamos.
    const loanWhere = hasDateFilter ? { dueDate: dateFilter } : {};
    const cashWhere = hasDateFilter ? { createdAt: dateFilter } : {};
    const clientWhere = hasDateFilter ? { createdAt: dateFilter } : {};

    const clientsCount = await this.prisma.client.count({ where: clientWhere });

    const loans = await this.prisma.loan.findMany({
      where: loanWhere,
      include: { payments: true },
    });

    const cashMovements = await this.prisma.cashMovement.findMany({
      where: cashWhere,
    });

    const totalLoansCount = loans.length;
    const activeLoansCount = loans.filter((l) => l.status === 'ACTIVO').length;
    const paidLoansCount = loans.filter((l) => l.status === 'PAGADO').length;

    let totalLentAmount = 0;
    let totalExpectedReturn = 0;
    let totalCollected = 0;

    loans.forEach((loan) => {
      if (loan.status === 'REFINANCIADO') return;

      totalLentAmount += Number(loan.amount) || 0;
      totalExpectedReturn += Number(loan.totalToPay) || 0;
      
      loan.payments.forEach((p) => {
        totalCollected += Number(p.amount) || 0;
      });
    });

    let cashBalance = 0;
    cashMovements.forEach((m) => {
      if (m.type === 'INGRESO') cashBalance += Number(m.amount) || 0;
      if (m.type === 'EGRESO') cashBalance -= Number(m.amount) || 0;
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
      loans,
    };
  }
}