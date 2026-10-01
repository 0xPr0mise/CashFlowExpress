import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLoanDto } from './dto/create-loan.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoansService {
  constructor(private prisma: PrismaService) {}

  // Helper nativo para generar un ID corto de 8 caracteres (alfanumérico limpio)
  private generateShortId(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  async create(createLoanDto: CreateLoanDto) {
    // Extraemos las banderas de refinanciación y los datos habituales del DTO
    const { 
      clientId, 
      dueDate, 
      schedule, 
      amount, 
      paymentMethod = 'EFECTIVO', 
      isRefinancing, 
      oldLoanId, 
      ...restData 
    } = createLoanDto as any;

    // 1. Creamos el nuevo préstamo en la base de datos inyectando el ID corto
    const loan = await this.prisma.loan.create({
      data: {
        id: this.generateShortId(), // <-- Acá se genera el ID corto de 8 caracteres (ej: "4k9z8x1m")
        ...restData,
        amount,
        paymentMethod,
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

    // 2. 🛡️ LÓGICA DE REFINANCIACIÓN: Si es una refinanciación, actualizamos el viejo y evitamos tocar la caja
    if (isRefinancing) {
      if (oldLoanId) {
        await this.prisma.loan.update({
          where: { id: oldLoanId },
          data: { status: 'REFINANCIADO' },
        });
      }
      // Retornamos directamente sin registrar egreso en caja (porque no hubo entrega de dinero físico)
      return loan;
    }

    // 3. Si NO es refinanciación (préstamo nuevo común), registramos automáticamente el EGRESO en la caja
    await this.prisma.cashMovement.create({
      data: {
        type: 'EGRESO',
        category: 'PRESTAMO_OTORGADO',
        amount: Number(amount),
        paymentMethod: paymentMethod,
        loanId: loan.id,
        description: `Desembolso de préstamo - ID: ${loan.id}`,
      },
    });

    return loan;
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

  // --- Método para registrar pagos ---
  async registerPayment(
    loanId: string,
    amount: number,
    paymentMethod = 'EFECTIVO',
    note?: string,
    targetInstallmentNumber?: number,
  ) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { payments: true, client: true },
    });

    if (!loan) {
      throw new NotFoundException('Préstamo no encontrado');
    }

    let schedule = [];
    try {
      schedule = loan.schedule ? JSON.parse(loan.schedule) : [];
    } catch (e) {
      schedule = [];
    }

    let remainingMoneyToApply = amount;

    // Aplicar a la cuota específica elegida
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

    // Aplicar en cascada si sobra dinero
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

    await this.prisma.loan.update({
      where: { id: loanId },
      data: {
        status: isFullyPaid ? 'PAGADO' : 'ACTIVO',
        schedule: JSON.stringify(schedule),
      },
    });

    // Registramos el INGRESO en caja con su método de pago y vínculo al préstamo
    await this.prisma.cashMovement.create({
      data: {
        type: 'INGRESO',
        category: 'COBRO_CUOTA',
        amount: amount,
        paymentMethod: paymentMethod,
        loanId: loanId,
        description: `Cobro cuota de préstamo - Cliente: ${loan.client?.name || loanId}`,
      },
    });

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

  async update(id: string, updateData: { status?: string; totalToPay?: number; schedule?: any }) {
    const loan = await this.prisma.loan.findUnique({ where: { id } });
    if (!loan) {
      throw new NotFoundException('Préstamo no encontrado');
    }

    return this.prisma.loan.update({
      where: { id },
      data: {
        ...(updateData.status && { status: updateData.status }),
        ...(updateData.totalToPay !== undefined && { totalToPay: updateData.totalToPay }),
        ...(updateData.schedule && { schedule: JSON.stringify(updateData.schedule) }),
      },
      include: { client: true, payments: true },
    });
  }

  async markAsBadDebt(id: string) {
    const loan = await this.prisma.loan.findUnique({ where: { id } });
    if (!loan) {
      throw new NotFoundException('Préstamo no encontrado');
    }

    return await this.prisma.loan.update({
      where: { id },
      data: {
        status: 'INCOBRABLE',
        schedule: "[]", // Vaciamos el cronograma para quitar los vencimientos pendientes
      },
    });
  }
}