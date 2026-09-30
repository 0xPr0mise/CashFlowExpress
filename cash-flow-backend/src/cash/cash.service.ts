import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CashService {
  constructor(private prisma: PrismaService) {}

  // Obtener todos los movimientos de caja ordenados por fecha
  async findAll() {
    return this.prisma.cashMovement.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        loan: {
          include: { client: true },
        },
      },
    });
  }

  // Crear un movimiento de caja manual (ingreso/egreso extra, gasto, etc.)
  async create(dto: {
    type: string;
    category: string;
    amount: number;
    paymentMethod?: string;
    description?: string;
  }) {
    return this.prisma.cashMovement.create({
      data: {
        type: dto.type,
        category: dto.category,
        amount: Number(dto.amount),
        paymentMethod: dto.paymentMethod || 'EFECTIVO',
        description: dto.description || null,
      },
    });
  }

  // Obtener balance general y desagregado por método de pago (Efectivo, Transferencia, etc.)
  async getBalance() {
    const movements = await this.prisma.cashMovement.findMany();

    const summary = movements.reduce((acc, mov) => {
      const method = (mov.paymentMethod || 'EFECTIVO').toUpperCase();
      const amount = Number(mov.amount || 0);
      const type = (mov.type || 'INGRESO').toUpperCase();

      if (!acc[method]) {
        acc[method] = { ingresos: 0, egresos: 0, net: 0 };
      }

      if (type === 'INGRESO') {
        acc[method].ingresos += amount;
        acc[method].net += amount;
      } else {
        acc[method].egresos += amount;
        acc[method].net -= amount;
      }

      return acc;
    }, {} as Record<string, { ingresos: number; egresos: number; net: number }>);

    return summary;
  }
}