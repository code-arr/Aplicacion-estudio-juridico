import { UserRole } from "src/entities/user.entity";

export class registerUserDto {
    email: string;
    password: string;
    role: UserRole.LAWYER | UserRole.ADMIN; 
}