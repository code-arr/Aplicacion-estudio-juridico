import { Controller, Get, Post } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { UserService } from 'src/services/user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('seeder')
  
  async userSeedData(): Promise<string> {
    return this.userService.userSeedData();
  }
  @Get("getAll")
    async getAllUsers():Promise<User[]>{
      return this.userService.getAllUsers();
    }
}
