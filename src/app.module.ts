import fs from 'node:fs';
import type { IncomingMessage } from 'node:http';
import path from 'node:path';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { AcceptLanguageResolver, HeaderResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { LoggerModule } from 'nestjs-pino';
import { destination, multistream } from 'pino';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';

import { AuthModule } from './modules/auth/auth.module.ts';
import { HealthCheckerModule } from './modules/health-checker/health-checker.module.ts';
import { UserModule } from './modules/user/user.module.ts';
import { ContextProvider } from './providers/context.provider.ts';
import { ApiConfigService } from './shared/services/api-config.service.ts';
import { GeneratorService } from './shared/services/generator.service.ts';
import { SharedModule } from './shared/shared.module.ts';

function resolveI18nPath(): string {
  const candidates = [path.join(process.cwd(), 'src/i18n/'), path.join(process.cwd(), 'dist/i18n/'), path.join(process.cwd(), 'dist/src/i18n/')];

  const found = candidates.find((candidate) => fs.existsSync(candidate));

  if (!found) {
    throw new Error(`i18n directory not found. Checked: ${candidates.join(', ')}`);
  }

  return found;
}

const SENSITIVE_BODY_FIELDS = ['password', 'oldPassword', 'newPassword', 'confirmPassword', 'token', 'accessToken', 'refreshToken'];

function redactSensitiveFields(body: unknown): unknown {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const redacted: Record<string, unknown> = { ...(body as Record<string, unknown>) };

  for (const field of SENSITIVE_BODY_FIELDS) {
    if (field in redacted) {
      redacted[field] = '[REDACTED]';
    }
  }

  return redacted;
}

@Module({
  imports: [
    AuthModule,
    UserModule,
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (_cls, req: { headers: Record<string, string | string[] | undefined> }) => {
          const requestId = (req.headers['x-request-id'] as string | undefined) ?? GeneratorService.getInstance().uuid();

          ContextProvider.setRequestId(requestId);
        },
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (configService: ApiConfigService) => ({
        throttlers: [configService.throttlerConfigs],
      }),
      inject: [ApiConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggerModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (configService: ApiConfigService) => {
        const { file, consoleLevel, fileLevel } = configService.loggerConfig;

        return {
          pinoHttp: {
            level: 'trace', // per-stream levels below decide what each output receives
            autoLogging: true,
            redact: {
              paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
              censor: '[REDACTED]',
            },
            // customProps runs again at request completion (after body-parser has run),
            // so this is the only point where req.body is populated
            customProps: (req: IncomingMessage & { body?: unknown }) => ({ body: redactSensitiveFields(req.body) }),
            mixin: () => {
              const requestId = ContextProvider.getRequestId();

              return requestId ? { requestId } : {};
            },
            stream: multistream([
              { level: consoleLevel, stream: process.stdout },
              {
                level: fileLevel,
                stream: destination({ dest: file, mkdir: true }),
              },
            ]),
          },
        };
      },
      inject: [ApiConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (configService: ApiConfigService) => configService.postgresConfig,
      inject: [ApiConfigService],
      dataSourceFactory: (options) => {
        if (!options) {
          throw new Error('Invalid options passed');
        }

        return Promise.resolve(addTransactionalDataSource(new DataSource(options)));
      },
    }),
    // eslint-disable-next-line canonical/id-match
    I18nModule.forRootAsync({
      useFactory: (configService: ApiConfigService) => ({
        fallbackLanguage: configService.fallbackLanguage,
        loaderOptions: {
          path: resolveI18nPath(),
          watch: configService.isDevelopment,
        },
      }),
      resolvers: [{ use: QueryResolver, options: ['lang'] }, AcceptLanguageResolver, new HeaderResolver(['x-lang'])],
      imports: [SharedModule],
      inject: [ApiConfigService],
    }),
    HealthCheckerModule,
  ],
  providers: [],
})
export class AppModule {}
