import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import { toHttpParams } from './api-base-url';
import { LatLng, WeatherCurrentDto, WeatherForecastDto, WeatherWindowDto, WeatherWindowRequest } from './models';

@Injectable({ providedIn: 'root' })
export class WeatherApi extends ApiClient {
  forecast(point: LatLng, hours?: number): Observable<WeatherForecastDto> {
    return this.http.get<WeatherForecastDto>(this.url('/weather/forecast'), {
      params: toHttpParams({ ...point, hours }),
    });
  }

  current(point: LatLng): Observable<WeatherCurrentDto> {
    return this.http.get<WeatherCurrentDto>(this.url('/weather/current'), { params: toHttpParams(point) });
  }

  window(body: WeatherWindowRequest): Observable<WeatherWindowDto> {
    return this.http.post<WeatherWindowDto>(this.url('/weather/window'), body);
  }
}
