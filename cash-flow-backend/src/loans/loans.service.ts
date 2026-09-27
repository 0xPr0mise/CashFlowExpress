import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLoanDto } from './dto/create-loan.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoansService {
  constructor(private prisma: PrismaService) {}

  create(createLoanDto: CreateLoanDto) {
    return this.prisma.loan.create({
      data: createLoanDto,
      include: { client: true },
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

  // --- NUEVO: Método para registrar pagos y actualizar saldos/caja ---
  async registerPayment(
    loanId: string,
    amount: number,
    paymentMethod = 'EFECTIVO',
    note?: string,
  ) {
    // 1. Buscar el préstamo existente con sus pagos actuales
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { payments: true },
    });

    if (!loan) {
      throw new NotFoundException('Préstamo no encontrado');
    }

    // 2. Calcular el total pagado hasta el momento y el saldo restante
    const totalPaidSoFar = loan.payments.reduce((acc, p) => acc + p.amount, 0);
    const newTotalPaid = totalPaidSoFar + amount;
    const remainingBalance = Math.max(0, loan.totalToPay - newTotalPaid);

    // Determinar si el pago cubre la totalidad del préstamo
    const isFullyPaid = remainingBalance <= 0;

    // 3. Crear el registro del pago en la base de datos
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

    // 4. Si se completó el saldo, actualizar el estado del préstamo a 'PAGADO'
    if (isFullyPaid) {
      await this.prisma.loan.update({
        where: { id: loanId },
        data: { status: 'PAGADO' },
      });
    }

    // 5. Registrar automáticamente el ingreso en la caja (CashMovement)
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
