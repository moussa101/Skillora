import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private authService: AuthService) {
    const clientID = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientID || !clientSecret) {
      console.warn(
        'GitHub OAuth not configured: GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET missing',
      );
    }

    super({
      clientID: clientID || 'not-configured',
      clientSecret: clientSecret || 'not-configured',
      callbackURL:
        process.env.GITHUB_CALLBACK_URL ||
        'http://localhost:3000/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    const { id, username, displayName, emails, photos } = profile;

    const user = await this.authService.validateOAuthUser({
      provider: 'GITHUB',
      providerId: id,
      email: emails?.[0]?.value || `${username}@github.local`,
      name: displayName || username,
      image: photos?.[0]?.value,
    });

    return user;
  }
}
