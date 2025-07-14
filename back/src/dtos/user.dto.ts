import { UserRole } from "src/entities/usuario.entity";

export class registerUserDto {
    email: string;
    password: string;
    role: UserRole.ABOGADO; 
}