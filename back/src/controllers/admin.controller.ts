import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';

import { Roles } from 'src/decorator/roles.decorator';
import { UserRole } from 'src/entities/user.entity';
import { AdminGuard } from 'src/guards/admin.guard';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { AdminService } from 'src/services/admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('seeder')
  async seedAdmin() {
    return this.adminService.seedAdmin();
  }

  @Get('')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAdmin() {
    return this.adminService.getAdmin();
  }
  @Delete('DeleteClient/:clientId')
  async deleteClient(@Param('clientId') clientId: string) {
    return this.adminService.deleteClient(clientId);
  }
}
