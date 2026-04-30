import { DataSource } from 'typeorm';
import 'dotenv/config';
import { Profile } from './profiles/profiles.entity';
import { User } from './users/users.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Profile, User],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
