import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from 'node_modules/@nestjs/typeorm';
import { User } from './users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
