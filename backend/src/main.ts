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
import helmet from 'helmet';
import * as compression from 'compression';

// Simple sanitizer to avoid logging sensitive fields
function sanitize(obj: any) {
  if (!obj || typeof obj !== 'object') return obj;
  const clone: any = Array.isArray(obj) ? [] : {};
  for (const k of Object.keys(obj)) {
    if (['password', 'token', 'authorization'].includes(k.toLowerCase())) {
      clone[k] = '***';
    } else if (typeof obj[k] === 'object') {
      clone[k] = sanitize(obj[k]);
    } else {
      clone[k] = obj[k];
    }
  }
  return clone;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });

  // Trust proxy (if running behind reverse proxy / load balancer)
  // Cast to any to access underlying Express methods
  (app as any).set('trust proxy', 1);

  // Security headers via helmet (contentSecurityPolicy left relaxed for Swagger/dev)
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  }));

  // Basic compression
  app.use(compression());

  // Enable CORS
  const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map(o => o.trim());
  app.enableCors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    maxAge: 600,
  });

  // Global validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    validationError: { target: false },
  }));

  // Basic request logging (skips in test env)
  if (process.env.NODE_ENV !== 'test') {
    app.use((req, _res, next) => {
      const { method, originalUrl, headers, body, query } = req as any;
      // Avoid noisy health checks
      if (!originalUrl.includes('health')) {
        console.log('[REQ]', method, originalUrl, JSON.stringify({
          query: sanitize(query),
          body: sanitize(body),
          ip: req.ip,
          ua: headers['user-agent']
        }));
      }
      next();
    });
  }

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
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
