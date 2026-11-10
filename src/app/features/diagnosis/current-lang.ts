import { inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';

export type UiLang = 'uk' | 'en';

export function currentLang() {
  const translate = inject(TranslateService);
  const toUiLang = (lang: string | undefined): UiLang => (lang === 'en' ? 'en' : 'uk');
  return toSignal(translate.onLangChange.pipe(map((event) => toUiLang(event.lang))), {
    initialValue: toUiLang(translate.currentLang || translate.defaultLang),
  });
}
