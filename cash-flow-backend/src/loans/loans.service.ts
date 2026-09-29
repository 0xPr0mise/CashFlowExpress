import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLoanDto } from './dto/create-loan.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoansService {
  constructor(private prisma: PrismaService) {}

  async create(createLoanDto: CreateLoanDto) {
    const { clientId, dueDate, schedule, ...restData } = createLoanDto;

    return this.prisma.loan.create({
      data: {
        ...restData,
        dueDate: dueDate ? new Date(dueDate) : null,
        schedule: schedule ? JSON.stringify(schedule) : null,
        client: {
          connect: { id: clientId },
        },
      },
      include: { 
        client: true,
        payments: true,
      },
    });
  }

  findAll() {
    return this.prisma.loan.findMany({
      include: { client: true, payments: true },
    });
  }

  findOne(id: string) {
    return this.prisma.loan.findUnique({
      where: { id },
      include: { client: true, payments: true },
    });
  }

  remove(id: string) {
    return this.prisma.loan.delete({
      where: { id },
    });
  }

  // --- Método para registrar pagos corregido ---
  async registerPayment(
    loanId: string,
    amount: number,
    paymentMethod = 'EFECTIVO',
    note?: string,
    targetInstallmentNumber?: number,
  ) {
    // 1. CORRECCIÓN: Traemos explícitamente el campo 'schedule' de la base de datos
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { payments: true },
    });

    if (!loan) {
      throw new NotFoundException('Préstamo no encontrado');
    }

    // 2. Parsear el schedule correctamente
    let schedule = [];
    try {
      schedule = loan.schedule ? JSON.parse(loan.schedule) : [];
    } catch (e) {
      schedule = [];
    }

    let remainingMoneyToApply = amount;

    // 3. Aplicar a la cuota específica elegida
    if (targetInstallmentNumber) {
      const targetInst = schedule.find(
        (i) => i.installmentNumber === targetInstallmentNumber,
      );
      if (targetInst && targetInst.status !== 'PAGADO') {
        const instTotal = targetInst.amount || 0;
        const alreadyPaid = targetInst.paidAmount || 0;
        const pendingOnInst = instTotal - alreadyPaid;

        if (remainingMoneyToApply >= pendingOnInst) {
          remainingMoneyToApply -= pendingOnInst;
          targetInst.paidAmount = instTotal;
          targetInst.status = 'PAGADO';
        } else {
          targetInst.paidAmount = alreadyPaid + remainingMoneyToApply;
          targetInst.status = 'PARCIAL';
          remainingMoneyToApply = 0;
        }
      }
    }

    // 4. Aplicar en cascada si sobra dinero
    if (remainingMoneyToApply > 0) {
      for (let installment of schedule) {
        if (remainingMoneyToApply <= 0) break;
        if (installment.status === 'PAGADO') continue;
        if (targetInstallmentNumber && installment.installmentNumber === targetInstallmentNumber) continue;

        const installmentTotal = installment.amount || 0;
        const alreadyPaidOnThisInst = installment.paidAmount || 0;
        const pendingOnThisInst = installmentTotal - alreadyPaidOnThisInst;

        if (remainingMoneyToApply >= pendingOnThisInst) {
          remainingMoneyToApply -= pendingOnThisInst;
          installment.paidAmount = installmentTotal;
          installment.status = 'PAGADO';
        } else {
          installment.paidAmount = alreadyPaidOnThisInst + remainingMoneyToApply;
          installment.status = 'PARCIAL';
          remainingMoneyToApply = 0;
        }
      }
    }

    const totalPaidSoFar = loan.payments.reduce((acc, p) => acc + p.amount, 0) + amount;
    const remainingBalance = Math.max(0, loan.totalToPay - totalPaidSoFar);
    
    const allInstallmentsPaid = schedule.length > 0 ? schedule.every((i) => i.status === 'PAGADO') : false;
    const isFullyPaid = remainingBalance <= 0 || allInstallmentsPaid;

    const payment = await this.prisma.payment.create({
      data: {
        loanId,
        amount,
        remainingBalance,
        paymentMethod,
        note,
        paymentType: isFullyPaid ? 'TOTAL' : 'PARCIAL',
      },
    });

    // 5. Guardar el schedule actualizado como texto JSON en la base de datos
    await this.prisma.loan.update({
      where: { id: loanId },
      data: {
        status: isFullyPaid ? 'PAGADO' : 'ACTIVO',
        schedule: JSON.stringify(schedule),
      },
    });

    await this.prisma.cashMovement.create({
      data: {
        type: 'INGRESO',
        category: 'COBRO_PRESTAMO',
        amount: amount,
        description: `Cobro de préstamo - ID: ${loanId}`,
      },
    });

    // 6. Opcional: devolvemos también el préstamo actualizado por si el frontend lo necesita directo
    const updatedLoan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { client: true, payments: true },
    });

    return {
      message: 'Pago registrado exitosamente',
      payment,
      loan: updatedLoan,
      remainingBalance,
      loanStatus: isFullyPaid ? 'PAGADO' : 'ACTIVO',
    };
  }
}