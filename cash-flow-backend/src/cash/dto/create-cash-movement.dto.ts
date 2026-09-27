export class CreateCashMovementDto {
  type: string; // 'INGRESO' o 'EGRESO'
  category: string; // Ej: 'COBRO_PRESTAMO', 'GASTO_OPERATIVO', 'RETIRO'
  amount: number;
  description?: string;
}
