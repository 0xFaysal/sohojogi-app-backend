import { ConfigService } from '@nestjs/config';

export function getConfigNumber(
  configService: ConfigService,
  key: string,
  fallback: number,
): number {
  const rawValue = configService.get<string | number>(key);
  const parsedValue = Number(rawValue ?? fallback);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}
