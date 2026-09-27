import { Controller, Get, Post, Body } from '@nestjs/common';
import { CashService } from './cash.service';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';

@Controller('cash')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  @Post()
  create(@Body() dto: CreateCashMovementDto) {
    return this.cashService.create(dto);
  }

  @Get()
  findAll() {
    return this.cashService.findAll();
  }

  @Get('balance')
  getBalance() {
    return this.cashService.getBalance();
  }
}
