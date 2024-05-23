export const AcCapitalize = (string) => {
  if (typeof string !== 'string') return string;

  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const AcToUpperCase = (string) => {
  if (typeof string !== 'string') return string;

  return string.toUpperCase();
};

export const AcToLowerCase = (string) => {
  if (typeof string !== 'string') return string;

  return string.toLowerCase();
};

export const AcAddDotToSentence = (string) => {
  if (typeof string !== 'string') return string;

  return string + '. ';
};
