// src/utils/rates.util.ts
import { Client } from '../entities/client.entity';
import { ClientItem } from '../entities/clientItem.entity';

export function resolveEffectiveRate(clientItem: ClientItem, client: Client) {
  // currency: override > client.currency
  const currency = clientItem.currencyOverride ?? client.currency;
  // rate: override > client.hourlyRate
  // Ambos son strings (TypeORM numeric) o null
  const hourlyRate =
    clientItem.hourlyRateOverride ?? client.hourlyRate ?? '0.00';
  return { currency, hourlyRate }; // hourlyRate como string
}

type MaybePricingStr = {
  hourlyRate?: string | null;
  currency?: string | null;
} | null;
type MaybePricingFlexible = {
  hourlyRate?: string | number | null;
  currency?: string | null;
} | null;

export function resolveEffectivePricing({
  clientItem,
  client,
}: {
  clientItem?: {
    hourlyRateOverride?: string | null;
    currencyOverride?: string | null;
  } | null;
  client?: MaybePricingFlexible;
}): { hourlyRate: number; currency: string | null } {
  // prioridad: override del clientItem > client padre
  const hourlyRateRaw =
    clientItem?.hourlyRateOverride ?? client?.hourlyRate ?? null;
  const currencyRaw = clientItem?.currencyOverride ?? client?.currency ?? null;

  // hourlyRateRaw puede ser string | number | null -> convertir a number seguro
  const hourlyRate =
    hourlyRateRaw === null ||
    hourlyRateRaw === undefined ||
    hourlyRateRaw === ''
      ? 0
      : typeof hourlyRateRaw === 'number'
        ? hourlyRateRaw
        : Number(hourlyRateRaw);

  const currency = (currencyRaw as string | null) ?? null;

  return { hourlyRate: Number.isFinite(hourlyRate) ? hourlyRate : 0, currency };
}
