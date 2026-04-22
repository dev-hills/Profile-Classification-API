import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from 'src/profiles/profiles.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Profile])],
  providers: [SeedService],
  controllers: [SeedController],
})
export class SeedModule {}
