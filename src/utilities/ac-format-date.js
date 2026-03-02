// Imports => DayJS
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';

require('dayjs/locale/nl');

// Imports => Config

export const AcFormatDate = (
  input,
  from = 'DD-MM-YYYY',
  to = 'DD MMM Y',
  // locale = null
) => {
  dayjs.locale('nl-NL');
  dayjs.extend(localizedFormat);
  dayjs.extend(relativeTime);
  dayjs.extend(advancedFormat);
  dayjs.extend(customParseFormat);

  // Verify valid date / dayjs object
  if (from && !dayjs(input, from).isValid()) {
    return input;
  } else if (!dayjs(input).isValid()) {
    return input;
  }

  // Format input
  return from ? dayjs(input, from).format(to) : dayjs(input).format(to);
};

export const AcGetTimeDifference = (
  time,
  now = dayjs(),
  format = null,
  ms = false
) => {
  dayjs.extend(localizedFormat);
  dayjs.extend(relativeTime);
  dayjs.extend(advancedFormat);
  dayjs.extend(customParseFormat);
  dayjs.locale('nl-NL');

  const start = dayjs(now).isValid() ? dayjs(now) : dayjs();
  const end = format ? dayjs(time, format) : dayjs(time);
  const diff = dayjs.duration(start.diff(end));

  if (ms) return diff.asMilliseconds();
  return diff;
};

export const AcGetDaysDifference = (date, now = dayjs()) => {
  dayjs.extend(localizedFormat);
  dayjs.extend(relativeTime);
  dayjs.extend(advancedFormat);
  dayjs.extend(customParseFormat);
  dayjs.locale('nl-NL');

  return dayjs(date).diff(now, 'days');
};

export const AcGetTimeUntilNow = (date) => {
  dayjs.extend(localizedFormat);
  dayjs.extend(relativeTime);
  dayjs.locale('nl-NL');

  return dayjs(date).fromNow();
};

export const sortDatesDesc = (firstDate, secondDate) => {
  dayjs.extend(localizedFormat);
  dayjs.extend(relativeTime);
  dayjs.extend(advancedFormat);
  dayjs.extend(customParseFormat);
  dayjs.locale('nl-NL');

  return dayjs(firstDate, 'YYYY-MM-DD HH:mm').isAfter(
    dayjs(secondDate, 'YYYY-MM-DD HH:mm')
  )
    ? -1
    : 1;
};

export default AcFormatDate;
