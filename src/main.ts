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

const domainWhitelist = [
  'https://cdn.jsdelivr.net',
  'https://www.gstatic.com',
  'https://firebaseinstallations.googleapis.com',
  'https://fcm.googleapis.com',
  'https://*.firebaseio.com',
  'https://fcmregistrations.googleapis.com',
  'https://static.cloudflareinsights.com',
];

// Inline <script> blocks (e.g. injected by third-party tags such as Cloudflare's beacon) that
// script-src-elem would otherwise reject outright. Allowlisting by hash — rather than
// 'unsafe-inline' — keeps the policy from accepting *any* injected inline script.
const inlineScriptHashes = ["'sha256-9Uwsy5XKAOLDN96l8TSQLGybMph7MSsqmkHNckwc8eA='", "'sha256-A9JfFQn1ufYrRoHDXY1mkPvs4BkHo5hTe5JHTDxRBrY='"];

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
          'connect-src': [
            "'self'",
            'blob:',
            'https://cdn.jsdelivr.net',
            'https://www.gstatic.com',
            'https://firebaseinstallations.googleapis.com',
            'https://fcm.googleapis.com',
            'https://*.firebaseio.com',
            'https://fcmregistrations.googleapis.com',
            'https://static.cloudflareinsights.com',
          ],
          'worker-src': [
            "'self'",
            'blob:',
            'https://cdn.jsdelivr.net',
            'https://www.gstatic.com',
            'https://firebaseinstallations.googleapis.com',
            'https://fcm.googleapis.com',
            'https://*.firebaseio.com',
            'https://fcmregistrations.googleapis.com',
            'https://static.cloudflareinsights.com',
          ],
          'script-src': [
            "'self'",
            'blob:',
            'https://cdn.jsdelivr.net',
            'https://www.gstatic.com',
            'https://firebaseinstallations.googleapis.com',
            'https://fcm.googleapis.com',
            'https://*.firebaseio.com',
            'https://fcmregistrations.googleapis.com',
            'https://static.cloudflareinsights.com',
          ],
          'script-src-elem': [
            "'self'",
            'blob:',
            'https://cdn.jsdelivr.net',
            'https://www.gstatic.com',
            'https://firebaseinstallations.googleapis.com',
            'https://fcm.googleapis.com',
            'https://*.firebaseio.com',
            'https://fcmregistrations.googleapis.com',
            'https://static.cloudflareinsights.com',
          ],
        },
      },
    }),
  );
  app.setGlobalPrefix('/api'); // use api as global prefix if you don't have subdomain
  app.use(
    compression({
      // `compression` buffers writes until `chunkSize` (16KB) worth of data has accumulated and
      // never flushes early on its own, which is fine for regular responses but starves the
      // dashboard's SSE feed (GET /api/devices/stream): each `telemetry`/`status`/`ping` write is
      // small, so live pushes sit stuck in the compression buffer instead of reaching the browser
      // — the chart only ever shows the initial REST-fetched history. Skip compressing that route
      // so its writes go straight to the client uncompressed and unbuffered.
      filter: (req, res) => (req.path === '/api/devices/stream' ? false : compression.filter(req, res)),
    }),
  );
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

  // Kafka isn't wired through @nestjs/microservices' connectMicroservice/startAllMicroservices —
  // KafkaProducerService/KafkaConsumerService (raw kafkajs) connect themselves from their own
  // onModuleInit, which already ran as part of NestFactory.create() above, same as
  // KafkaTopicsInitializer. See src/modules/kafka/.

  if (configService.natsEnabled || configService.mqttEnabled) {
    try {
      await app.startAllMicroservices();
    } catch (error) {
      // A broker being unreachable/misconfigured shouldn't take the whole HTTP API down with it —
      // log and keep serving; the affected transport just won't have a working consumer/producer.
      app.get(Logger).error(`Failed to start one or more microservices (NATS/MQTT): ${error instanceof Error ? error.message : String(error)}`);
    }
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
