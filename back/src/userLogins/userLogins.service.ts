import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserLogin } from 'src/userLogins/userLogin.entity';
import { GeoIpService } from './geoip.service';

@Injectable()
export class UserLoginsService {
  constructor(
    @InjectRepository(UserLogin)
    private readonly repo: Repository<UserLogin>,
    private readonly geo: GeoIpService,
  ) {}

  async create(input: {
    userId: string;
    deviceId: string;
    userAgent: string;
    ip: string;
  }) {
    const log = this.repo.create(input);
    await this.repo.save(log);

    // Enriquecimiento asincrónico, sin bloquear la respuesta de /auth/login
    (async () => {
      try {
        const g = await this.geo.lookup(input.ip);
        if (g && (g.city || g.region || g.country || g.countryCode)) {
          await this.repo.update(log.id, g);
        }
      } catch {}
    })();

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
