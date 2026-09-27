import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';

@Injectable()
export class CashService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateCashMovementDto) {
    return this.prisma.cashMovement.create({
      data: dto,
    });
  }

  findAll() {
    return this.prisma.cashMovement.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBalance() {
    const movements = await this.prisma.cashMovement.findMany();
    let balance = 0;

    for (const m of movements) {
      if (m.type === 'INGRESO') {
        balance += m.amount;
      } else if (m.type === 'EGRESO') {
        balance -= m.amount;
      }
    }

    return {
      balance,
      totalMovements: movements.length,
    };
  }
}
