import { WeatherVerdict } from './enums';
import { LatLng } from './common';

export interface WeatherHourDto {
  time: string; temperatureC: number; humidityPct: number; windSpeedMs: number;
  windGustMs: number; precipitationMm: number; precipitationProbPct: number;
}
export interface WeatherForecastDto {
  fetchedAt: string; source: 'open-meteo'; cached: boolean; hourly: WeatherHourDto[];
}
export interface WeatherCurrentDto { time: string; temperatureC: number; humidityPct: number; windSpeedMs: number }
export interface WeatherConstraints {
  maxWindMs?: number; minTempC?: number; maxTempC?: number; maxRainMm?: number; rainFreeHours?: number;
}
export interface WeatherWindowRequest extends LatLng { constraints?: WeatherConstraints }
export interface WeatherWindowDto {
  verdict: WeatherVerdict;
  reason: string;
  reasonParams: Record<string, string | number>;
  nextGoAt?: string;
  hours: { time: string; verdict: WeatherVerdict; causes: string[] }[];
}
