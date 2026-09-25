import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ApplicationsModule } from './applications/applications.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { validateEnvironment } from './config/auth.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 15 * 60 * 1_000,
        limit: 10,
      },
    ]),
    DatabaseModule,
    UsersModule,
    AuthModule,
    ApplicationsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
