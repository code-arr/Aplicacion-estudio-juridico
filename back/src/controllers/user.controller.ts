import { Controller, Get, Param, Post } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UserService } from '../services/user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('seeder')
  async userSeedData(): Promise<string> {
    return this.userService.userSeedData();
  }
  @Get('getAll')
  async getAllUsers(): Promise<User[]> {
    return this.userService.getAllUsers();
  }
  @Get('getUserById/:id')
  async getUserById(@Param('id') id: string): Promise<User | null> {
    return this.userService.getOneById(id);
  }
}
