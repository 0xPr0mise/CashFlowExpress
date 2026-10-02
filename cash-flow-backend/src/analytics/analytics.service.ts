import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  getAnalytics(arg0: { preset: string; startDate: string; endDate: string; }) {
    throw new Error('Method not implemented.');
  }
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(preset?: string, startDateStr?: string, endDateStr?: string) {
    const dateFilter: any = {};
    const now = new Date();

    // 1. Procesamiento de filtros de fecha robusto
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
    } else if (
      startDateStr &&
      endDateStr &&
      startDateStr !== 'undefined' &&
      endDateStr !== 'undefined' &&
      startDateStr !== 'null' &&
      endDateStr !== 'null'
    ) {
      const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
      const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);

      const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
      const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
      dateFilter.gte = start;
      dateFilter.lte = end;
    }

    const hasDateFilter = Object.keys(dateFilter).length > 0;

    // 2. Consultas a base de datos
    const clientWhere = hasDateFilter ? { createdAt: dateFilter } : {};
    const cashWhere = hasDateFilter ? { createdAt: dateFilter } : {};
    const loanWhere = hasDateFilter ? { createdAt: dateFilter } : {};

    const [clientsCount, loans, cashMovementRecords] = await Promise.all([
      this.prisma.client.count({ where: clientWhere }),
      this.prisma.loan.findMany({
        where: loanWhere,
        include: { 
          payments: true,
          client: { select: { id: true, name: true, phone: true, dni: true } }
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.cashMovement.findMany({ 
        where: cashWhere,
        orderBy: { date: 'asc' }
      }),
    ]);

    // 3. Procesamiento y Agregaciones de Negocio
    const totalLoansCount = loans.length;
    const activeLoansCount = loans.filter((l) => l.status === 'ACTIVO').length;
    const paidLoansCount = loans.filter((l) => l.status === 'PAGADO').length;

    let totalLentAmount = 0;
    let totalExpectedReturn = 0;
    let totalCollected = 0;

    loans.forEach((loan) => {
      if (loan.status === 'REFINANCIADO') return;

      const capital = Number(loan.amount) || 0;
      const expected = Number(loan.totalToPay) || 0;

      totalLentAmount += capital;
      totalExpectedReturn += expected;

      loan.payments.forEach((p) => {
        totalCollected += Number(p.amount) || 0;
      });
    });

    let cashBalance = 0;
    cashMovementRecords.forEach((m) => {
      const amount = Number(m.amount) || 0;
      if (m.type === 'INGRESO') cashBalance += amount;
      if (m.type === 'EGRESO') cashBalance -= amount;
    });

    // 4. Retorno con contrato tipado, limpios para el frontend (incluyendo movements)
    return {
      clientsCount,
      totalLoansCount,
      activeLoansCount,
      paidLoansCount,
      totalLentAmount,
      totalExpectedReturn,
      totalCollected,
      cashBalance,
      loans: loans.map(loan => ({
        id: loan.id,
        amount: Number(loan.amount) || 0,
        totalToPay: Number(loan.totalToPay) || 0,
        status: loan.status,
        createdAt: loan.createdAt,
        dueDate: loan.dueDate,
        client: loan.client,
        payments: (loan.payments || []).map(p => ({
          id: p.id,
          amount: Number(p.amount) || 0,
          createdAt: p.createdAt,
        }))
      })),
      movements: cashMovementRecords.map(m => ({
        id: m.id,
        type: m.type,
        category: m.category,
        amount: Number(m.amount) || 0,
        paymentMethod: m.paymentMethod,
        description: m.description,
        date: m.date,
        createdAt: m.createdAt,
      })),
    };
  }
}