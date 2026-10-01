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

    // Contadores generales (mantenemos los conteos para las métricas de estado)
    const totalLoansCount = loans.length;
    const activeLoansCount = loans.filter((l) => l.status === 'ACTIVO').length;
    const paidLoansCount = loans.filter((l) => l.status === 'PAGADO').length;

    let totalLentAmount = 0;
    let totalExpectedReturn = 0;
    let totalCollected = 0;

    loans.forEach((loan) => {
      // ⚠️ FIX DE REFINANCIACIÓN: 
      // Si el préstamo está refinanciado, su monto y retorno esperado original 
      // ya no deben sumar a la cartera activa para evitar duplicaciones o distorsiones.
      if (loan.status === 'REFINANCIADO') {
        return; // Salta este registro en los acumuladores de dinero
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

    // Opcional: mandamos también la lista limpia o conteos si se necesitan en el front
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