import './boilerplate.polyfill';

import fs from 'node:fs';
import path from 'node:path';

import { ClassSerializerInterceptor, HttpStatus, UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ExpressAdapter } from '@nestjs/platform-express';
import compression from 'compression';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import type { SASLOptions } from 'kafkajs';
import { Logger } from 'nestjs-pino';
import { initializeTransactionalContext } from 'typeorm-transactional';

import { AppModule } from './app.module.ts';
import { AllExceptionsFilter } from './filters/all-exceptions.filter.ts';
import { HttpExceptionFilter } from './filters/bad-request.filter.ts';
import { QueryFailedFilter } from './filters/query-failed.filter.ts';
import { TranslationInterceptor } from './interceptors/translation-interceptor.service.ts';
import { setupSwagger } from './setup-swagger.ts';
import { ApiConfigService } from './shared/services/api-config.service.ts';
import { TranslationService } from './shared/services/translation.service.ts';
import { SharedModule } from './shared/shared.module.ts';

export async function bootstrap(): Promise<NestExpressApplication> {
  initializeTransactionalContext();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter(), { cors: true, bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enable('trust proxy'); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'connect-src': ["'self'", 'blob:', 'https://cdn.jsdelivr.net'],
          'worker-src': ["'self'", 'blob:', 'https://cdn.jsdelivr.net'],
          'script-src': ["'self'", 'blob:', 'https://cdn.jsdelivr.net'],
          'script-src-elem': ["'self'", 'blob:', 'https://cdn.jsdelivr.net', 'https://www.gstatic.com'],
        },
      },
    }),
  );
  app.setGlobalPrefix('/api'); // use api as global prefix if you don't have subdomain
  app.use(compression());
  app.enableVersioning();

  const reflector = app.get(Reflector);

  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter(reflector), new QueryFailedFilter(reflector));

  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector), new TranslationInterceptor(app.select(SharedModule).get(TranslationService)));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      transform: true,
      dismissDefaultMessages: true,
      exceptionFactory: (errors) => new UnprocessableEntityException(errors),
    }),
  );

  const configService = app.select(SharedModule).get(ApiConfigService);

  // only start nats if it is enabled
  if (configService.natsEnabled) {
    const natsConfig = configService.natsConfig;
    app.connectMicroservice({
      transport: Transport.NATS,
      options: {
        url: `nats://${natsConfig.host}:${natsConfig.port}`,
        queue: 'main_service',
      },
    });
  }

  // only start mqtt if it is enabled
  if (configService.mqttEnabled) {
    app.connectMicroservice({
      transport: Transport.MQTT,
      options: configService.mqttConfig,
    });
  }

  // only start kafka if it is enabled
  if (configService.kafkaEnabled) {
    const kafkaConfig = configService.kafkaConfig;
    app.connectMicroservice({
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: kafkaConfig.clientId,
          brokers: kafkaConfig.brokers.split(','),
          ssl: kafkaConfig.ssl,
          sasl: kafkaConfig.sasl as SASLOptions | undefined,
        },
        consumer: {
          groupId: kafkaConfig.groupId,
        },
      },
    });
  }

  if (configService.natsEnabled || configService.mqttEnabled || configService.kafkaEnabled) {
    await app.startAllMicroservices();
  }

  if (configService.documentationEnabled) {
    setupSwagger(app);
  }

  // SPA fallback: client-side routed paths (no file extension, not under /api) serve
  // the frontend's index.html so deep-links / hard refreshes work with browser-history routing.
  app.use((request: Request, response: Response, next: NextFunction) => {
    const indexHtml = path.join(process.cwd(), 'dist-client', 'index.html');

    if (request.method === 'GET' && !request.path.startsWith('/api') && !path.extname(request.path) && fs.existsSync(indexHtml)) {
      response.sendFile(indexHtml);
    } else {
      next();
    }
  });

  // Starts listening for shutdown hooks
  if (!configService.isDevelopment) {
    app.enableShutdownHooks();
  }

  const port = configService.appConfig.port;

  // skip listening only inside the vite dev server (it listens itself);
  // vite sets env.PROD to a boolean, while plain node/bun leave it undefined
  if ((<any>import.meta).env?.PROD !== false) {
    await app.listen(port);
    app.get(Logger).log(`Server is running on port ${port}`);
  }

  return app;
}

export const viteNodeApp = bootstrap();
