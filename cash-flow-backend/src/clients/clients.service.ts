import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(createClientDto: CreateClientDto) {
    const { referredById, ...restData } = createClientDto;

    return this.prisma.client.create({
      data: {
        ...restData,
        referredById:
          referredById && referredById.trim() !== '' ? referredById : null,
      },
      include: {
        referredBy: true,
      },
    });
  }

  async findAll() {
    const clients = await this.prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        referredBy: true,
        referrals: true,
        loans: {
          include: {
            payments: true, // Inyecta los pagos de cada préstamo
          },
        },
      },
    });

    return clients.map((client) => {
      let totalPending = 0;

      if (client.loans && Array.isArray(client.loans)) {
        client.loans.forEach((loan: any) => {
          const status = loan.status ? String(loan.status).toUpperCase() : 'ACTIVO';
          
          if (status !== 'PAGADO') {
            const totalToPay = Number(loan.totalToPay ?? loan.amount ?? 0);

            // Suma de pagos desde el array de relations (probando todas las variantes de nombres)
            const paymentsSum = Array.isArray(loan.payments)
              ? loan.payments.reduce((acc: number, p: any) => acc + Number(p.amount ?? p.monto ?? p.valor ?? p.cuota ?? 0), 0)
              : 0;

            // Por si el sistema guarda un campo directo de pago acumulado en el préstamo
            const directPaidAmount = Number(loan.paidAmount ?? 0);

            // Tomamos el mayor valor registrado para asegurarnos de descontar el pago
            const totalPaidSoFar = Math.max(paymentsSum, directPaidAmount);

            const netDebt = totalToPay - totalPaidSoFar;
            totalPending += netDebt > 0 ? netDebt : 0;
          }
        });
      }

      return {
        ...client,
        totalPending,
      };
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        referredBy: true,
        referrals: true,
        loans: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    let totalPending = 0;
    if (client.loans && Array.isArray(client.loans)) {
      client.loans.forEach((loan: any) => {
        const status = loan.status ? String(loan.status).toUpperCase() : 'ACTIVO';
        if (status !== 'PAGADO') {
          const totalToPay = Number(loan.totalToPay ?? loan.amount ?? 0);
          
          const paymentsSum = Array.isArray(loan.payments)
            ? loan.payments.reduce((acc: number, p: any) => acc + Number(p.amount ?? p.monto ?? p.valor ?? p.cuota ?? 0), 0)
            : 0;

          const directPaidAmount = Number(loan.paidAmount ?? 0);
          const totalPaidSoFar = Math.max(paymentsSum, directPaidAmount);

          const netDebt = totalToPay - totalPaidSoFar;
          totalPending += netDebt > 0 ? netDebt : 0;
        }
      });
    }

    return {
      ...client,
      totalPending,
    };
  }

  async remove(id: string) {
    return this.prisma.client.delete({ where: { id } });
  }
}