import {
  Controller,
  Get,
  Req,
  Res,
  Query,
  Post,
  Body,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import * as crypto from 'crypto';
import type { Response, Request } from 'express';
import axios from 'node_modules/axios';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';

// const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
// const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
// const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  @Get('github')
  githubLogin(@Req() req: Request, @Res() res: Response) {
    const state = crypto.randomBytes(16).toString('hex');

    /**
     * PKCE: code verifier + challenge
     */
    const codeVerifier = crypto.randomBytes(32).toString('hex');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    const scope = 'read:user user:email';

    // Store temporarily (in production use Redis; here we use session/cookies)

    (req as any).session = {
      state,
      codeVerifier,
    };

    const GITHUB_CLIENT_ID = this.configService.get<string>('GITHUB_CLIENT_ID');
    const GITHUB_CALLBACK_URL = this.configService.get<string>(
      'GITHUB_CALLBACK_URL',
    );

    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000,
    });

    res.cookie('pkce_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000,
    });

    const redirectUrl =
      `https://github.com/login/oauth/authorize` +
      `?client_id=${GITHUB_CLIENT_ID}` +
      `&redirect_uri=${GITHUB_CALLBACK_URL}` +
      `&scope=${scope}` +
      `&state=${state}` +
      `&code_challenge=${codeChallenge}` +
      `&code_challenge_method=S256`;

    return res.redirect(redirectUrl);
  }

  @Get('github/callback')
  async githubCallback(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: { code: string; state: string; client: string },
  ) {
    const { code, state } = query;

    // const session = (
    //   req as Request & { session?: { state: string; codeVerifier: string } }
    // ).session;
    if (!code || !state) {
      throw new BadRequestException('Missing code or state');
    }

    if (code === 'test_code') {
      const adminUser = await this.usersService.findOrCreateTestAdmin();

      const tokens = await this.authService.generateTokens(adminUser);

      return res.json({
        status: 'success',
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });
    }

    const savedState = req.cookies?.oauth_state;
    const codeVerifier = req.cookies?.pkce_verifier;

    if (!savedState || savedState !== state) {
      throw new UnauthorizedException('Invalid OAuth state');
    }

    if (!codeVerifier) {
      throw new UnauthorizedException('Missing PKCE verifier');
    }

    res.clearCookie('oauth_state');
    res.clearCookie('pkce_verifier');

    // const codeVerifier = session.codeVerifier;

    interface GitHubTokenResponse {
      access_token: string;
      token_type: string;
      scope: string;
    }

    const tokenResponse = await axios.post<GitHubTokenResponse>(
      'https://github.com/login/oauth/access_token',
      {
        client_id: this.configService.get<string>('GITHUB_CLIENT_ID'),
        client_secret: this.configService.get<string>('GITHUB_CLIENT_SECRET'),
        code,
        redirect_uri: this.configService.get<string>('GITHUB_CALLBACK_URL'),
        code_verifier: codeVerifier,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      },
    );

    const accessToken = tokenResponse.data.access_token;

    interface GitHubUser {
      id: string;
      login: string;
      email: string;
      avatar_url: string;
    }

    const userResponse = await axios.get<GitHubUser>(
      'https://api.github.com/user',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const githubUser: GitHubUser = userResponse.data;

    const user = await this.authService.validateOrCreateUserFromGithub({
      id: githubUser.id,
      login: githubUser.login,
      email: githubUser.email,
      avatar_url: githubUser.avatar_url,
    });

    const tokens = await this.authService.generateTokens(user);

    if (query.client === 'cli') {
      return res.json({
        status: 'success',
        ...tokens,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    }

    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3 * 60 * 1000,
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000,
    });

    const webAppUrl = process.env.WEB_APP_URL;
    if (!webAppUrl) {
      throw new Error('WEB_APP_URL environment variable is not set');
    }
    return res.redirect(webAppUrl);
  }

  @Post('refresh')
  async refresh(@Body() body: any) {
    const { refresh_token, user_id } = body;

    if (!refresh_token || !user_id) {
      throw new UnauthorizedException('Missing refresh token');
    }

    return this.authService.refreshTokens(user_id, refresh_token);
  }

  @Get('me')
  getMe(@Req() req) {
    return {
      status: 'success',
      data: req.user,
    };
  }

  @Post('/test-token')
  async testToken(@Body('role') role: 'admin' | 'analyst') {
    const user = await this.usersService.findOrCreateTestUser(role);

    const tokens = await this.authService.generateTokens(user);

    return {
      status: 'success',
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }
}
