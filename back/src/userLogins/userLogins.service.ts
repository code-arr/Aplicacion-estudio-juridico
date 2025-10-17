import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserLogin } from 'src/userLogins/userLogin.entity';

@Injectable()
export class UserLoginsService {
  constructor(
    @InjectRepository(UserLogin)
    private readonly repo: Repository<UserLogin>,
  ) {}

  async create(input: {
    userId: string;
    deviceId: string;
    userAgent: string;
    ip: string;
  }) {
    const log = this.repo.create(input);
    await this.repo.save(log);
    return log;
  }

  /**
   * Devuelve hasta `maxDevices` últimos logins de DISPOSITIVOS DISTINTOS
   * excluyendo `excludeDeviceId`. Ordenados por fecha desc.
   */
  async getUsefulLogins(
    userId: string,
    excludeDeviceId: string,
    maxDevices = 3,
  ) {
    const raw = await this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 60,
    });

    const seen = new Set<string>();
    const result: UserLogin[] = [];

    for (const r of raw) {
      if (r.deviceId === excludeDeviceId) continue;
      if (seen.has(r.deviceId)) continue;
      seen.add(r.deviceId);
      result.push(r);
      if (result.length === maxDevices) break;
    }
    return result;
  }
}
