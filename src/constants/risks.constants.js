import { AcLockObject } from '@utils/ac-lock-object';

export const RISKS = AcLockObject({
  low: '<strong>Laag risico</strong>: op basis van de ingevoerde gegevens en ontvangen informatie adviseren wij u op dit moment om de reguliere verhuurprocedure te volgen.',
  medium:
    '<strong>Gemiddeld risico</strong>: op basis van de ingevoerde gegevens en ontvangen informatie adviseren wij u op dit moment om de reguliere verhuurprocedure te volgen met extra oplettendheid.',
  high: '<strong>Onderneem actie</strong>: op basis van de ingevoerde gegevens en ontvangen informatie adviseren wij u op dit moment om extra maatregelen te nemen teneinde wanbetaling, fraude en/of overlast te voorkomen.',
  unknown:
    '<strong>Onbekend risico</strong>: op basis van de ingevoerde gegevens en ontvangen informatie adviseren wij u op dit moment om de reguliere verhuurprocedure te volgen.',
  disclaimer:
    'GGN maakt bij het opstellen van deze rapportage enkel en alleen gebruik van externe data van Experian. GGN en Experian zijn onder geen beding verantwoordelijk en/of aansprakelijk te stellen voor de gevolgen welke voortkomen uit de door u genomen beslissing.',
});

export const RISK_LEVEL = AcLockObject({
  green: 'low',
  low: 'low',
  orange: 'medium',
  medium: 'medium',
  red: 'high',
  high: 'high',
  grey: 'unknown',
  unknown: 'unknown',
});
