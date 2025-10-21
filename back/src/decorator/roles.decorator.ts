import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/entities/user.entity'; // o donde tengas definido tu enum

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);