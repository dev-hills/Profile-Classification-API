import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Profile {
  @PrimaryColumn()
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column()
  gender!: string;

  @Column('float')
  gender_probability!: number;

  @Column()
  sample_size!: number;

  @Column()
  age!: number;

  @Column()
  age_group!: string;

  @Column()
  country_id!: string;

  @Column('float')
  country_probability!: number;

  @Column()
  created_at!: string;
}
