import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UserLoginsService } from './userLogins.service';
import { AuthGuard } from 'src/guards/auth.guard'; // tu guard actual

@UseGuards(AuthGuard)
@Controller('me')
export class UserLoginsController {
  constructor(private readonly service: UserLoginsService) {}

  @Get('logins')
  async getMine(
    @Req() req: any, // si tu guard setea req.user
    @Query('excludeDeviceId') excludeDeviceId?: string,
  ) {
    const userId: string = req.user?.id || req.user?.sub; // según tu payload
    return this.service.getUsefulLogins(userId, excludeDeviceId ?? '', 3);
  }
}
