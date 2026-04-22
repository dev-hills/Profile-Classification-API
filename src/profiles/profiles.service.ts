import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from './profiles.entity';
import { Repository } from 'typeorm';
import axios from 'axios';
import { v7 as uuidv7 } from 'uuid';
import {
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';

type GenderizeResponse = {
  gender: string | null;
  probability: number;
  count: number;
};

type AgifyResponse = {
  age: number | null;
};

type NationalizeResponse = {
  country: {
    country_id: string;
    probability: number;
  }[];
};

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private profileRepo: Repository<Profile>,
  ) {}

  private getAgeGroup(age: number): string {
    if (age <= 12) return 'child';
    if (age <= 19) return 'teenager';
    if (age <= 59) return 'adult';
    return 'senior';
  }

  async create(name: string) {
    if (!name || name.trim() === '') {
      throw new BadRequestException({
        status: 'error',
        message: 'Name query parameter is required',
      });
    }

    name = name.trim().toLowerCase();

    const isValidName = /^[a-zA-Z]+$/.test(name);

    if (!isValidName) {
      throw new UnprocessableEntityException({
        status: 'error',
        message: 'Name must be a string',
      });
    }

    const existing = await this.profileRepo.findOne({
      where: { name },
    });

    if (existing) {
      return {
        status: 'success',
        message: 'Profile already exists',
        data: existing,
      };
    }

    const [genderRes, ageRes, nationalityRes] = await Promise.all([
      axios.get<GenderizeResponse>(`https://api.genderize.io?name=${name}`),
      axios.get<AgifyResponse>(`https://api.agify.io?name=${name}`),
      axios.get<NationalizeResponse>(`https://api.nationalize.io?name=${name}`),
    ]);

    const genderData = genderRes.data;
    const ageData = ageRes.data;
    const countryData = nationalityRes.data;

    if (!genderData.gender || genderData.count === 0) {
      throw new BadGatewayException({
        status: 'error',
        message: 'Genderize returned an invalid response',
      });
    }

    if (ageData.age === null || ageData.age === undefined) {
      throw new BadGatewayException({
        status: 'error',
        message: 'Agify returned an invalid response',
      });
    }

    if (!countryData.country || countryData.country.length === 0) {
      throw new BadGatewayException({
        status: 'error',
        message: 'Nationalize returned an invalid response',
      });
    }

    const { gender, probability } = genderData;
    const { age } = ageData;
    const { country } = countryData;

    const topCountry = country.reduce(
      (prev, curr) => (curr.probability > prev.probability ? curr : prev),
      country[0],
    );

    const profile = this.profileRepo.create({
      id: uuidv7(),
      name,
      gender,
      gender_probability: probability,
      // sample_size: count,
      age,
      age_group: this.getAgeGroup(age),
      country_id: topCountry.country_id,
      country_probability: topCountry.probability,
      created_at: new Date().toISOString(),
    });

    await this.profileRepo.save(profile);

    return {
      status: 'success',
      data: profile,
    };
  }

  async findOne(id: string) {
    const profile = await this.profileRepo.findOne({ where: { id } });

    if (!profile) {
      return {
        status: 'error',
        message: 'Profile not found',
      };
    }

    return {
      status: 'success',
      data: profile,
    };
  }

  async findAll(query: {
    gender?: string;
    country_id?: string;
    age_group?: string;
  }) {
    const qb = this.profileRepo.createQueryBuilder('profile');

    if (query.gender) {
      qb.andWhere('LOWER(profile.gender) = LOWER(:gender)', {
        gender: query.gender,
      });
    }

    if (query.country_id) {
      qb.andWhere('LOWER(profile.country_id) = LOWER(:country_id)', {
        country_id: query.country_id,
      });
    }

    if (query.age_group) {
      qb.andWhere('LOWER(profile.age_group) = LOWER(:age_group)', {
        age_group: query.age_group,
      });
    }

    const data = await qb.getMany();

    return {
      status: 'success',
      count: data.length,
      data: data.map((p) => ({
        id: p.id,
        name: p.name,
        gender: p.gender,
        age: p.age,
        age_group: p.age_group,
        country_id: p.country_id,
      })),
    };
  }

  async delete(id: string) {
    const profile = await this.profileRepo.findOne({ where: { id } });

    if (!profile) {
      return {
        status: 'error',
        message: 'Profile not found',
      };
    }

    await this.profileRepo.remove(profile);

    return {
      status: 'success',
    };
  }
}
