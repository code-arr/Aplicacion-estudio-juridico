import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PasswordResetToken } from "src/entities/passwordResetToken.entity";
import { PasswordResetRepository } from "src/repositories/passwordResetToken.repository";

@Module({
    imports: [TypeOrmModule.forFeature([PasswordResetToken])],
    controllers: [],
    providers: [PasswordResetRepository],
    exports: [PasswordResetRepository]
})
export class PasswordResetTokenModule {}