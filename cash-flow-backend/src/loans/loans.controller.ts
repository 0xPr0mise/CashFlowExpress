import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';

@Controller('loans') // <--- ESTO ES LO QUE HABILITA LA RUTA /loans
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  create(@Body() createLoanDto: CreateLoanDto) {
    return this.loansService.create(createLoanDto);
  }

  @Get()
  findAll() {
    return this.loansService.findAll(); // <--- Esto responde a GET /loans
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.loansService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.loansService.remove(id);
  }

  @Post(':id/pay')
  async registerPayment(
    @Param('id') loanId: string,
    @Body() body: { amount: number; paymentMethod?: string; note?: string },
  ) {
    return this.loansService.registerPayment(
      loanId,
      body.amount,
      body.paymentMethod,
      body.note,
    );
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLoanDto: any) {
    return this.loansService.update(id, updateLoanDto);
  }

}
