import { Injectable } from '@nestjs/common';
import { InjectRepository } from 'node_modules/@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Profile } from 'src/profiles/profiles.entity';
import * as fs from 'fs/promises';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Profile)
    private profileRepo: Repository<Profile>,
  ) {}

  //SLOW IMPLEMENTATION - runs in O(n) and can cause timeouts with large datasets. Use with caution.
  //   async seed() {
  //     const filePath = 'src/seed/data/seed_profiles.json';
  //     const raw = fs.readFileSync(filePath, 'utf-8');

  //     interface SeedProfile {
  //       name: string;
  //       gender: string;
  //       gender_probability: number;
  //       age: number;
  //       age_group: string;
  //       country_id: string;
  //       country_name: string;
  //       country_probability: number;
  //     }

  //     interface SeedFile {
  //       profiles: SeedProfile[];
  //     }

  //     const parsed = JSON.parse(raw) as SeedFile;
  //     const data: SeedProfile[] = parsed.profiles;

  //     for (const item of data) {
  //       const exists = await this.profileRepo.findOne({
  //         where: { name: item.name.toLowerCase() },
  //       });

  //       if (exists) continue;

  //       const profile = this.profileRepo.create({
  //         id: uuidv7(),
  //         name: item.name.toLowerCase(),
  //         gender: item.gender,
  //         gender_probability: item.gender_probability,
  //         age: item.age,
  //         age_group: item.age_group,
  //         country_id: item.country_id,
  //         country_name: item.country_name,
  //         country_probability: item.country_probability,
  //         created_at: new Date().toISOString(),
  //       });

  //       await this.profileRepo.save(profile);
  //     }

  //     return { status: 'success', message: 'Seeding completed' };
  //   }

  async seed() {
    const filePath = 'src/seed/data/seed_profiles.json';
    const raw = await fs.readFile(filePath, 'utf-8');

    type SeedProfile = {
      name: string;
      gender: string;
      gender_probability: number;
      age: number;
      age_group: string;
      country_id: string;
      country_name: string;
      country_probability: number;
    };

    type SeedFile = {
      profiles: SeedProfile[];
    };

    const parsed = JSON.parse(raw) as SeedFile;
    const data = parsed.profiles;

    console.log('length', data.length);

    const incomingNames = data.map((p) => p.name.toLowerCase());

    const existing = await this.profileRepo.find({
      select: ['name'],
      where: {
        name: In(incomingNames),
      },
    });

    const existingSet = new Set(existing.map((p) => p.name));

    const toInsert = data
      .map((item) => {
        const name = item.name.toLowerCase();

        if (existingSet.has(name)) return null;

        return this.profileRepo.create({
          id: uuidv7(),
          name,
          gender: item.gender,
          gender_probability: item.gender_probability,
          age: item.age,
          age_group: item.age_group,
          country_id: item.country_id,
          country_name: item.country_name,
          country_probability: item.country_probability,
          created_at: new Date().toISOString(),
        });
      })
      .filter(Boolean) as Profile[];

    if (toInsert.length > 0) {
      await this.profileRepo
        .createQueryBuilder()
        .insert()
        .into(Profile)
        .values(toInsert)
        .orIgnore() // important for safety + speed
        .execute();
    }

    return {
      status: 'success',
      inserted: toInsert.length,
      skipped: data.length - toInsert.length,
      message: 'Seeding completed',
    };
  }
}
