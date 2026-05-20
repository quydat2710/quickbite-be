import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { MenuModule } from './menu/menu.module';
import { ReviewsModule } from './reviews/reviews.module';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantCategory } from './entities/restaurant-category.entity';
import { Review } from './entities/review.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    // PostgreSQL — restaurant data, reviews
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'quickbite'),
        password: config.get('DB_PASSWORD', 'quickbite_secret'),
        database: config.get('DB_RESTAURANT_DATABASE', 'quickbite_restaurants'),
        entities: [Restaurant, RestaurantCategory, Review],
        synchronize: config.get('NODE_ENV') === 'development',
        logging: config.get('NODE_ENV') === 'development' ? ['error', 'warn'] : false,
        maxQueryExecutionTime: 1000, // Log queries slower than 1s
      }),
      inject: [ConfigService],
    }),

    // MongoDB — menu data (flexible schema)
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: `${config.get('MONGO_URI')}/quickbite_menus?authSource=admin`,
      }),
      inject: [ConfigService],
    }),

    RestaurantsModule,
    MenuModule,
    ReviewsModule,
  ],
})
export class RestaurantServiceModule {}
