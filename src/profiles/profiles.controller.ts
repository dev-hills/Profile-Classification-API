import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Query,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { ProfilesService } from './profiles.service';

@Controller('api/profiles')
export class ProfilesController {
  constructor(private readonly service: ProfilesService) {}

  @Post()
  createProfile(@Body() dto: CreateProfileDto) {
    return this.service.create(dto.name);
  }

  @Get('search')
  searchProfiles(
    @Query('q') q: string,
    @Query() query: { page?: number; limit?: number },
  ) {
    return this.service.search(q, query);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get()
  getAll(
    @Query()
    query: {
      gender?: string;
      country_id?: string;
      age_group?: string;
    },
  ) {
    return this.service.findAll(query);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
    return;
  }
}
