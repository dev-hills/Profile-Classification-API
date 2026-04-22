import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Profile {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column()
  gender!: string;

  @Column('float')
  gender_probability!: number;

  @Column()
  age!: number;

  @Column()
  age_group!: string;

  @Column()
  country_id!: string;

  @Column()
  country_name!: string;

  @Column('float')
  country_probability!: number;

  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at!: Date;
}
