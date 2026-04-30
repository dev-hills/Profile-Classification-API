import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Query,
  Delete,
  HttpCode,
  UseGuards,
  Res,
} from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/users.entity';
import type { Response } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/profiles')
export class ProfilesController {
  constructor(private readonly service: ProfilesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  createProfile(@Body() dto: CreateProfileDto) {
    return this.service.create(dto.name);
  }

  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  searchProfiles(
    @Query('q') q: string,
    @Query() query: { page?: number; limit?: number },
  ) {
    return this.service.search(q, query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  getOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get()
  @Roles(UserRole.ADMIN)
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
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
    return;
  }

  @Get('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  async exportCsv(@Query() query: any, @Res() res: Response) {
    const csv = await this.service.buildCsv(query);

    const timestamp = new Date().toISOString();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="profiles_${timestamp}.csv"`,
    );

    return res.send(csv);
  }
}
