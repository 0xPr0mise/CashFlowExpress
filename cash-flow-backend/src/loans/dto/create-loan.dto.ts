// src/loans/dto/create-loan.dto.ts
export class CreateLoanDto {
  clientId: string;
  amount: number;
  installments: number;
  frequency: string;
  interestRate: number; 
  dueDate: string;      
  totalToPay: number;
  days: number;         
  schedule?: any;
  paymentMethod?: string;
  
  // Propiedades opcionales para la lógica de refinanciación
  isRefinancing?: boolean;
  oldLoanId?: string;
}