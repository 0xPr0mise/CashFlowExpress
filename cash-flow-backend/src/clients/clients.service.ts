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
    return this.prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        referredBy: true,
        referrals: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.client.findUnique({
      where: { id },
      include: {
        referredBy: true,
        referrals: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.client.delete({ where: { id } });
  }
}
