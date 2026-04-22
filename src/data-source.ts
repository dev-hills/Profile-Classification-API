import { DataSource } from 'typeorm';
import { Profile } from './profiles/profiles.entity';
import 'dotenv/config';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Profile],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
