export const AcHasNumericCharacter = (value) => {
  return new RegExp(/[0-9]/).test(value);
};

export const AcHasUppercaseCharacters = (value) => {
  return new RegExp(/[A-Z]/).test(value);
};

export const AcHasLowercaseCharacters = (value) => {
  return new RegExp(/[a-z]/).test(value);
};

export const AcHasMixedCharacters = (value) => {
  return AcHasLowercaseCharacters(value) && AcHasUppercaseCharacters(value);
};

export const AcHasSpecialCharacter = (value) => {
  return new RegExp(/[!#@$%^&*)(+=._-]/).test(value);
};

export const AcIsLongEnough = (value, len) => {
  return value.length >= len;
};

export const StrengthColour = (count) => {
  if (count < 2) return 'red';
  if (count < 3) return 'yellow';
  if (count < 4) return 'orange';
  if (count < 5) return 'lightgreen';
  if (count < 6) return 'green';
};

export const AcGetPasswordStrength = (value) => {
  let strengths = 0;
  if (AcIsLongEnough(value, 4)) strengths++;
  if (AcIsLongEnough(value, 8)) strengths++;
  if (AcHasNumericCharacter(value)) strengths++;
  if (AcHasMixedCharacters(value)) strengths++;
  if (AcHasSpecialCharacter(value)) strengths++;
  return strengths;
};

export default AcGetPasswordStrength;
