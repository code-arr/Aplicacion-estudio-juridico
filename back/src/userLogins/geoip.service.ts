// src/userLogins/geoip.service.ts
import axios from 'axios';
import { Injectable } from '@nestjs/common';

type Geo = {
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
};
type CacheItem = { data: Geo; ts: number };

function normalizeIp(ip: string) {
  return ip?.startsWith('::ffff:') ? ip.slice(7) : ip;
}

@Injectable()
export class GeoIpService {
  private cache = new Map<string, CacheItem>();
  private ttlMs = (Number(process.env.GEOIP_TTL_MIN) || 10080) * 60_000;

  async lookup(ipRaw: string): Promise<Geo> {
    const ip = normalizeIp(ipRaw);
    if (!ip) return {};

    const hit = this.cache.get(ip);
    if (hit && Date.now() - hit.ts < this.ttlMs) return hit.data;

    const timeout = Number(process.env.GEOIP_TIMEOUT_MS) || 1500;
    const provider = (process.env.GEOIP_PROVIDER || 'ipapi').toLowerCase();
    let data: Geo = {};

    try {
      if (provider === 'ipinfo') {
        const token = process.env.GEOIP_API_KEY;
        const url = `https://ipinfo.io/${encodeURIComponent(ip)}?token=${token ?? ''}`;
        const r = await axios.get(url, { timeout });
        data = {
          city: r.data.city,
          region: r.data.region,
          country: r.data.country, // ej. "AR"
          countryCode: r.data.country,
        };
      } else {
        // ipapi por defecto
        const url = `https://ipapi.co/${encodeURIComponent(ip)}/json/`;
        const r = await axios.get(url, { timeout });
        data = {
          city: r.data.city,
          region: r.data.region,
          country: r.data.country_name, // ej. "Argentina"
          countryCode: r.data.country, // ej. "AR"
        };
      }
    } catch {
      data = {};
    }

    this.cache.set(ip, { data, ts: Date.now() });
    return data;
  }
}
