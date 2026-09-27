export class CreateLoanDto {
  clientId: string;
  amount: number;
  totalToPay: number;
  installments: number;
  frequency: string; // Ej: "DIARIO", "SEMANAL", "MENSUAL"
}