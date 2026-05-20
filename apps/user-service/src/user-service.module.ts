import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AddressesModule } from './addresses/addresses.module';
import { User } from './entities/user.entity';
import { UserAddress } from './entities/user-address.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { OtpRequest } from './entities/otp-request.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'quickbite'),
        password: config.get('DB_PASSWORD', 'quickbite_secret'),
        database: config.get('DB_USER_DATABASE', 'quickbite_users'),
        entities: [User, UserAddress, RefreshToken, OtpRequest],
        synchronize: config.get('NODE_ENV') === 'development', // auto-sync in dev
        logging: config.get('NODE_ENV') === 'development' ? ['error', 'warn'] : false,
        maxQueryExecutionTime: 1000, // Log queries slower than 1s
      }),
      inject: [ConfigService],
    }),

    AuthModule,
    UsersModule,
    AddressesModule,
  ],
})
export class UserServiceModule {}
