import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const clientsCount = await this.prisma.client.count();
    const loans = await this.prisma.loan.findMany({
      include: { payments: true },
    });

    const cashMovements = await this.prisma.cashMovement.findMany();

    // Calcular estadísticas de préstamos
    const totalLoansCount = loans.length;
    const activeLoansCount = loans.filter((l) => l.status === 'ACTIVO').length;
    const paidLoansCount = loans.filter((l) => l.status === 'PAGADO').length;

    let totalLentAmount = 0;
    let totalExpectedReturn = 0;
    let totalCollected = 0;

    loans.forEach((loan) => {
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
    };
  }
}
