import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Headers
  app.use(helmet());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Strict CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Research Vault API')
    .setDescription('Secure Research Data Management System - REST API.')
    .setVersion('0.1.0')
    .addTag('health', 'Service liveness and readiness')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const configService = app.get(ConfigService);
  const port = Number(configService.get<string>('PORT') ?? 4000);

  await app.listen(port, '0.0.0.0');
  
  console.log(`API listening at http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}
void bootstrap();