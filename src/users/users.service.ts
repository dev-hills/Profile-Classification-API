import { Injectable } from '@nestjs/common';
import { DeepPartial, Repository } from 'node_modules/typeorm';
import { User, UserRole } from './users.entity';
import { InjectRepository } from 'node_modules/@nestjs/typeorm';
import { v7 as uuidv7 } from 'uuid';
import bcrypt from 'bcrypt';

interface GithubUserPayload {
  github_id: string;
  username: string;
  email?: string;
  avatar_url?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByGithubId(github_id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { github_id } });
  }

  async findOrCreateTestAdmin() {
    let user = await this.usersRepository.findOne({
      where: { username: 'test-admin' },
    });

    if (!user) {
      user = this.usersRepository.create({
        id: uuidv7(),
        github_id: 'test-admin',
        username: 'test-admin',
        email: 'admin@test.com',
        avatar_url: '',
        role: 'admin',
        is_active: true,
      } as DeepPartial<User>);

      await this.usersRepository.save(user);
    }

    return user;
  }

  async findOrCreateTestUser(role: 'admin' | 'analyst') {
    const githubId = role === 'admin' ? 'test-admin' : 'test-analyst';

    let user = await this.usersRepository.findOne({
      where: { github_id: githubId },
    });

    if (!user) {
      user = this.usersRepository.create({
        id: uuidv7(),
        github_id: githubId,
        username: githubId,
        email: `${role}@test.com`,
        avatar_url: '',
        role,
        is_active: true,
      } as DeepPartial<User>);

      await this.usersRepository.save(user);
    }

    return user;
  }

  async createOrUpdateGithubUser(payload: GithubUserPayload): Promise<User> {
    let user: User | null = await this.findByGithubId(payload.github_id);

    if (!user) {
      user = this.usersRepository.create({
        id: uuidv7(),
        github_id: payload.github_id,
        username: payload.username,
        email: payload.email || null,
        avatar_url: payload.avatar_url || null,
        role: UserRole.ANALYST,
        is_active: true,
        last_login_at: new Date().toISOString(),
      } as DeepPartial<User>);

      return this.usersRepository.save(user);
    }

    user.username = payload.username;
    user.email = payload.email || user.email;
    user.avatar_url = payload.avatar_url || user.avatar_url;
    user.last_login_at = new Date();

    return this.usersRepository.save(user);
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    const hashedToken = refreshToken
      ? await bcrypt.hash(refreshToken, 10)
      : null;

    await this.usersRepository.update(userId, {
      refresh_token_hash: hashedToken ?? undefined,
    });
  }

  async validateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const user = await this.findById(userId);

    if (!user || !user.refresh_token_hash) {
      return false;
    }

    return bcrypt.compare(refreshToken, user.refresh_token_hash);
  }

  async deactivateUser(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      is_active: false,
    });
  }
}
