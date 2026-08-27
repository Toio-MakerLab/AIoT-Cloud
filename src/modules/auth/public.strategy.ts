import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport';

import { IS_PUBLIC_USER } from '../../decorators/auth-user.decorator.ts';

@Injectable()
export class PublicStrategy extends PassportStrategy(Strategy, 'public') {
  override validate(): void {
    this.success({ [IS_PUBLIC_USER]: true });
  }
}
