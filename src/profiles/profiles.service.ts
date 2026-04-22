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
    min_age?: number;
    max_age?: number;
    min_gender_probability?: number;
    min_country_probability?: number;
    sort_by?: 'age' | 'created_at' | 'gender_probability';
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Number(query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const order = query.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const sortBy = query.sort_by || 'created_at';

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

    if (query.min_age !== undefined) {
      qb.andWhere('profile.age >= :min_age', {
        min_age: query.min_age,
      });
    }

    if (query.max_age !== undefined) {
      qb.andWhere('profile.age <= :max_age', {
        max_age: query.max_age,
      });
    }

    if (query.min_gender_probability !== undefined) {
      qb.andWhere('profile.gender_probability >= :min_gender_probability', {
        min_gender_probability: query.min_gender_probability,
      });
    }

    if (query.min_country_probability !== undefined) {
      qb.andWhere('profile.country_probability >= :min_country_probability', {
        min_country_probability: query.min_country_probability,
      });
    }

    qb.orderBy(`profile.${sortBy}`, order);
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      status: 'success',
      page,
      limit,
      total,
      data: data.map((p) => ({
        id: p.id,
        name: p.name,
        gender: p.gender,
        gender_probability: p.gender_probability,
        age: p.age,
        age_group: p.age_group,
        country_id: p.country_id,
        country_name: p.country_name,
        country_probability: p.country_probability,
        created_at: p.created_at,
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

  async search(q: string, query: { page?: number; limit?: number }) {
    if (!q || q.trim() === '') {
      throw new BadRequestException({
        status: 'error',
        message: 'Unable to interpret query',
      });
    }

    const text = q.toLowerCase();

    const filters: {
      gender?: string;
      country_id?: string;
      min_age?: number;
      max_age?: number;
      age_group?: string;
    } = {};

    if (text.includes('male') && !text.includes('female')) {
      filters.gender = 'male';
    }

    if (text.includes('female')) {
      filters.gender = 'female';
    }

    const countryMap: Record<string, string> = {
      nigeria: 'NG',
      kenya: 'KE',
      angola: 'AO',
      benin: 'BJ',
      ghana: 'GH',
    };

    for (const [name, code] of Object.entries(countryMap)) {
      if (text.includes(name)) {
        filters.country_id = code;
        break;
      }
    }

    if (text.includes('young')) {
      filters.min_age = 16;
      filters.max_age = 24;
    }

    if (text.includes('teenager') || text.includes('teens')) {
      filters.age_group = 'teenager';
    }

    if (text.includes('adult')) {
      filters.age_group = 'adult';
    }

    if (text.includes('senior')) {
      filters.age_group = 'senior';
    }

    const minAgeMatch = text.match(/(?:over|above|more than|>)\s*(\d+)/i);
    if (minAgeMatch) {
      filters.min_age = Number(minAgeMatch[1]);
    }

    const maxAgeMatch = text.match(/(?:under|below|less than|<)\s*(\d+)/i);
    if (maxAgeMatch) {
      filters.max_age = Number(maxAgeMatch[1]);
    }

    if (Object.keys(filters).length === 0) {
      throw new BadRequestException({
        status: 'error',
        message: 'Unable to interpret query',
      });
    }

    return this.findAll({
      ...filters,
      page: query?.page,
      limit: query?.limit,
    });
  }
}
