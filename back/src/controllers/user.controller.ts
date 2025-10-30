import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
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
  @Post('verifyPassword')
  async verifyPassword(
    @Body('email') email: string,
    @Body('password') password: string,
  ): Promise<boolean> {
    return this.userService.verifyPassword(email, password);
  }

  @Post('newPassword')
  async changePassword(
    @Body('email') email: string,
    @Body('newPassword') newPassword: string,
  ): Promise<string | void> {
    return this.userService.changePassword(email, newPassword);
  }

  @Delete(":userId")
  async deleteUser(@Param("userId") userId : string) {
    return this.userService.deleteUser(userId);
  }
}
