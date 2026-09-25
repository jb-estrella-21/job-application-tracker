import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { getJwtPolicy } from '../config/auth.config.js';
import { RefreshSessionService } from './refresh-session.service.js';

@Module({
  imports: [
    UsersModule,
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtPolicy = getJwtPolicy(configService);

        return {
          secret: jwtPolicy.secret,
        signOptions: {
            algorithm: jwtPolicy.algorithm,
            issuer: jwtPolicy.issuer,
            audience: jwtPolicy.audience,
            expiresIn: jwtPolicy.accessTokenExpiresIn,
        },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshSessionService],
})
export class AuthModule {}
