import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import helmet from "helmet";
import * as compression from "compression";
import { buildRuntimeDbLog } from "./database/db-config";
import { Request, Response, NextFunction } from "express";

function sanitize(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((v) => sanitize(v));
  if (typeof obj !== "object") return obj;
  const source = obj as Record<string, unknown>;
  const clone: Record<string, unknown> = {};
  for (const k of Object.keys(source)) {
    const lower = k.toLowerCase();
    if (["password", "token", "authorization"].includes(lower)) {
      clone[k] = "***";
    } else if (source[k] && typeof source[k] === "object") {
      clone[k] = sanitize(source[k]);
    } else {
      clone[k] = source[k];
    }
  }
  return clone;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { cors: false });
  (app as unknown as { set: (k: string, v: unknown) => void }).set(
    "trust proxy",
    1,
  );

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy:
        process.env.NODE_ENV === "production" ? undefined : false,
    }),
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  app.use(compression());

  const allowedOrigins = (
    process.env.CORS_ORIGINS ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000"
  )
    .split(",")
    .map((o) => o.trim());
  app.enableCors({
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps, curl, Postman, etc.)
      if (!origin) return cb(null, true);
      // Allow configured origins
      if (allowedOrigins.includes(origin)) return cb(null, true);
      // In development, be more permissive
      if (process.env.NODE_ENV === "development") {
        return cb(null, true);
      }
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization,Accept",
    maxAge: 600,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      validationError: { target: false },
    }),
  );

  if (process.env.NODE_ENV !== "test") {
    app.use((req: Request, _res: Response, next: NextFunction) => {
      const { method, originalUrl, headers, query } = req;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { body } = req;
      if (!originalUrl.includes("health")) {
        // eslint-disable-next-line no-console
        console.log(
          "[REQ]",
          method,
          originalUrl,
          JSON.stringify({
            query: sanitize(query),
            body: sanitize(body),
            ip: req.ip,
            ua: headers["user-agent"],
          }),
        );
      }
      next();
    });
  }

  if (process.env.NODE_ENV !== "production") {
    const { SwaggerModule, DocumentBuilder } = await import("@nestjs/swagger");
    const config = new DocumentBuilder()
      .setTitle("Front Desk Clinic System API")
      .setDescription("API documentation for the Front Desk Clinic System")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config, {
      include: [AppModule],
      deepScanRoutes: true,
    });
    SwaggerModule.setup("api", app, document);
    // eslint-disable-next-line no-console
    console.log(
      `Swagger docs available at: http://localhost:${process.env.PORT || 3001}/api`,
    );
  }

  const port = process.env.PORT || 3001;
  const dbLog = buildRuntimeDbLog();
  if (dbLog.nodeEnv === "production" && dbLog.dbName !== "front_desk_system") {
    throw new Error(
      `Refusing to start: production requires DB_NAME=front_desk_system (got ${dbLog.dbName})`,
    );
  }
  if (dbLog.nodeEnv !== "test" && dbLog.dbName === "clinic_test") {
    throw new Error(
      "Refusing to start: clinic_test database selected outside test NODE_ENV",
    );
  }
  // eslint-disable-next-line no-console
  console.log("[BOOT] Runtime configuration (sanitized):", dbLog);

  await app.listen(port, "0.0.0.0");
  // eslint-disable-next-line no-console
  console.log(`Application is running on: http://localhost:${port}`);
}

void bootstrap();
