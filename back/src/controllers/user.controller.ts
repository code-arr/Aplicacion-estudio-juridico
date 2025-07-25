import { Controller, Post } from '@nestjs/common';
import { UserService } from 'src/services/user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('seeder')
  
  async userSeedData(): Promise<string> {
    return this.userService.userSeedData();
  }
}
