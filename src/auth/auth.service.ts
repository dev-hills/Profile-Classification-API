import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from 'node_modules/@nestjs/jwt';
import { User } from 'src/users/users.entity';
import { UsersService } from 'src/users/users.service';
import * as crypto from 'crypto';

interface JwtPayload {
  sub: string;
  role: string;
  username: string;
}

interface GitHubProfile {
  id: string;
  login: string;
  email?: string;
  avatar_url?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateOrCreateUserFromGithub(profile: GitHubProfile) {
    return this.usersService.createOrUpdateGithubUser({
      github_id: profile.id,
      username: profile.login,
      email: profile.email,
      avatar_url: profile.avatar_url,
    });
  }

  async generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      username: user.username,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '3m',
    });

    const refreshToken = crypto.randomBytes(64).toString('hex');

    await this.usersService.updateRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const isValid = await this.usersService.validateRefreshToken(
      userId,
      refreshToken,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(userId);

    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return this.generateTokens(user);
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
  }

  async validateUser(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}
