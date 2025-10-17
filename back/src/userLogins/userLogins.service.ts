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

  private async pruneOlderForDevice(userId: string, deviceId: string) {
    await this.repo.query(
      `
    DELETE FROM "user_logins" ul
    WHERE ul."userId" = $1
      AND ul."deviceId" = $2
      AND ul."id" <> (
        SELECT "id" FROM "user_logins"
        WHERE "userId" = $1 AND "deviceId" = $2
        ORDER BY "createdAt" DESC
        LIMIT 1
      )
    `,
      [userId, deviceId],
    );
  }

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

    // ⬇️ mantener SOLO el último por (userId, deviceId)
    try {
      await this.pruneOlderForDevice(input.userId, input.deviceId);
    } catch {}

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
    const rows = await this.repo.query(
      `
    WITH ranked AS (
      SELECT
        "id", "userId", "deviceId", "userAgent", "ip",
        "createdAt", "city", "region", "country", "countryCode",
        ROW_NUMBER() OVER (
          PARTITION BY "deviceId"
          ORDER BY "createdAt" DESC
        ) AS rn
      FROM "user_logins"
      WHERE "userId" = $1
        AND ($2 = '' OR "deviceId" <> $2)
    )
    SELECT
      "id",
      "userId",
      "deviceId",
      "userAgent",
      "ip",
      "createdAt",
      "city",
      "region",
      "country",
      "countryCode"
    FROM ranked
    WHERE rn = 1
    ORDER BY "createdAt" DESC
    LIMIT $3
    `,
      [userId, excludeDeviceId || '', maxDevices],
    );

    return rows;
  }
}
