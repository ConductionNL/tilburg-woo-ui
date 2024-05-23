import {AcIsSet} from './ac-get-type-of';

export const AcHexToRgb = (hex, alpha = 1) => {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  const r = result ? parseInt(result[1], 16) : null;
  const g = result ? parseInt(result[2], 16) : null;
  const b = result ? parseInt(result[3], 16) : null;

  const output = {r, g, b, full: `${r}, ${g}, ${b}`};

  if (AcIsSet(alpha)) {
    output.alpha = alpha;
    output.full = `${output.full}, ${alpha}`;
  }

  return output;
};

const componentToHex = c => {
  const hex = c.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
};

export const AcRgbToHex = (r, g, b) => {
  //Create hex code from r-g-b-values
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
};
