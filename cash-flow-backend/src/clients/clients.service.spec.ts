// src/clients/clients.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(createClientDto: CreateClientDto) {
    return this.prisma.client.create({
      data: createClientDto,
    });
  }

  async findAll() {
    return this.prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { loans: true }, // Trae los préstamos asociados si los hay
    });
    if (!client) throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    return client;
  }

  async remove(id: string) {
    return this.prisma.client.delete({
      where: { id },
    });
  }
}