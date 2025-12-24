import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Public } from 'src/auth/public.decorator';
import { Roles } from 'src/decorator/roles.decorator';
import { UserRole } from 'src/entities/user.entity';
import { AdminGuard } from 'src/guards/admin.guard';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { AdminService } from 'src/services/admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // 👇 NUEVO: Setup inicial (sin autenticación)
  @Public()
  @Post('setup')
  async setupFirstAdmin(@Body() body: { email: string; password: string }) {
    return this.adminService.setupFirstAdmin(body.email, body.password);
  }

  @Post('seeder')
  async seedAdmin() {
    return this.adminService.seedAdmin();
  }

  // 👇 NUEVO: Endpoint para crear admin
  @Post('create')
  @Roles(UserRole.ADMIN) // Solo un admin puede crear otro admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createAdmin(@Body() body: { email: string; password: string }) {
    return this.adminService.createAdmin(body.email, body.password);
  }

  @Get('')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAdmin() {
    return this.adminService.getAdmin();
  }

  @Delete('deleteClient/:clientId')
  async deleteClient(@Param('clientId') clientId: string) {
    return this.adminService.deleteClient(clientId);
  }
}

