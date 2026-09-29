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
        // Convertimos el arreglo/objeto del cronograma a un String JSON
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

  // --- Método para registrar pagos ---
  async registerPayment(
    loanId: string,
    amount: number,
    paymentMethod = 'EFECTIVO',
    note?: string,
  ) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { payments: true },
    });

    if (!loan) {
      throw new NotFoundException('Préstamo no encontrado');
    }

    const totalPaidSoFar = loan.payments.reduce((acc, p) => acc + p.amount, 0);
    const newTotalPaid = totalPaidSoFar + amount;
    const remainingBalance = Math.max(0, loan.totalToPay - newTotalPaid);
    const isFullyPaid = remainingBalance <= 0;

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

    if (isFullyPaid) {
      await this.prisma.loan.update({
        where: { id: loanId },
        data: { status: 'PAGADO' },
      });
    }

    await this.prisma.cashMovement.create({
      data: {
        type: 'INGRESO',
        category: 'COBRO_PRESTAMO',
        amount: amount,
        description: `Cobro de préstamo - ID: ${loanId}`,
      },
    });

    return {
      message: 'Pago registrado exitosamente',
      payment,
      remainingBalance,
      loanStatus: isFullyPaid ? 'PAGADO' : 'ACTIVO',
    };
  }
}