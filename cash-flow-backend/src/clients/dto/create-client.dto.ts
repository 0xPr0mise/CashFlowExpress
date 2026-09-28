// src/clients/dto/create-client.dto.ts
export class CreateClientDto {
  name: string;
  phone: string;
  dni?: string;
  address?: string;
  reference?: string;
  creditLimit?: number;
  referredById?: string;
  email?: string;
}