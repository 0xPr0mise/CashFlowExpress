// cash-flow-backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // Habilitar CORS para que el frontend pueda consumir la API
    app.enableCors();
    await app.listen(3000);
}
bootstrap();
