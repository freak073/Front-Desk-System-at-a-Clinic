// import { NestFactory } from '@nestjs/core';
// import { ValidationPipe } from '@nestjs/common';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);

//   // Enable CORS for frontend communication
//   app.enableCors({
//     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//     credentials: true,
//   });

//   // Enable global validation
//   app.useGlobalPipes(new ValidationPipe({
//     whitelist: true,
//     forbidNonWhitelisted: true,
//     transform: true,
//   }));

//   // Swagger setup
//   if (process.env.NODE_ENV !== 'production') {
//     const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
//     const config = new DocumentBuilder()
//       .setTitle('Front Desk Clinic System API')
//       .setDescription('API documentation for the Front Desk Clinic System')
//       .setVersion('1.0')
//       .addBearerAuth()
//       .build();
//     const document = SwaggerModule.createDocument(app, config);
//     SwaggerModule.setup('api', app, document);
//     console.log(`Swagger docs available at: http://localhost:${process.env.PORT || 3001}/api`);
//   }

//   const port = process.env.PORT || 3001;
//   await app.listen(port);
//   console.log(`Application is running on: http://localhost:${port}`);
// }
// bootstrap();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger (only in non-production)
  if (process.env.NODE_ENV !== 'production') {
    const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
    
    const config = new DocumentBuilder()
      .setTitle('Front Desk Clinic System API')
      .setDescription('API documentation for the Front Desk Clinic System')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    // Explicitly include modules if needed (Swagger v7 change)
    const document = SwaggerModule.createDocument(app, config, {
      include: [AppModule],
      deepScanRoutes: true,
    });

    SwaggerModule.setup('api', app, document);
    console.log(`Swagger docs available at: http://localhost:${process.env.PORT || 3001}/api`);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
