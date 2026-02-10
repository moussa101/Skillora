import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';
import { AuthService } from '../auth.service';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      privateKeyString: process.env.APPLE_PRIVATE_KEY,
      callbackURL:
        process.env.APPLE_CALLBACK_URL ||
        'http://localhost:3000/auth/apple/callback',
      scope: ['name', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    idToken: any,
    profile: any,
  ): Promise<any> {
    // Apple sends user info only on first login
    const email = idToken?.email || profile?.email;
    const name = profile?.name
      ? `${profile.name.firstName || ''} ${profile.name.lastName || ''}`.trim()
      : undefined;

    const user = await this.authService.validateOAuthUser({
      provider: 'APPLE',
      providerId: idToken?.sub || profile?.id,
      email: email,
      name: name,
      image: undefined, // Apple doesn't provide profile pictures
    });

    return user;
  }
}
