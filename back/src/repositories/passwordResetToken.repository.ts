// src/repositories/password-reset.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PasswordResetToken } from 'src/entities/passwordResetToken.entity';
import { Repository, IsNull } from 'typeorm';


@Injectable()
export class PasswordResetRepository {
  constructor(
    @InjectRepository(PasswordResetToken)
    private readonly repo: Repository<PasswordResetToken>,
  ) {}

  async createToken(data: Partial<PasswordResetToken>) {
    const token = this.repo.create(data);
    return this.repo.save(token);
  }

  async invalidateAll(userId: string) {
    if (!userId) return;
    await this.repo.update({ userId, usedAt: IsNull() }, { usedAt: new Date() });
  }

  async findValidByHash(tokenHash: string) {
    return this.repo.findOne({ where: { tokenHash } });
  }

  async markUsed(id: string) {
    await this.repo.update(id, { usedAt: new Date() });
  }
}