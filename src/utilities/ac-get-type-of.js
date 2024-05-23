const patterns = {
  email: new RegExp(
    // eslint-disable-next-line
    /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i
  ),
  phone: new RegExp(/[0-9\-\+]+$/i),
  slim_postal_code: new RegExp(/^[1-9][0-9]{3} ?((?!sa|sd|ss)[a-z]{2})?$/i),
  postal_code: new RegExp(/^[1-9][0-9]{3} ?(?!sa|sd|ss)[a-z]{2}$/i),
  numeric: new RegExp(/^\d+$/),
  alphanumeric: new RegExp(/^([a-zA-Z0-9 '.-]+)$/i),
  alphabetical: new RegExp(/^([a-zA-Z '.-]+)$/i),
};

export const AcGetTypeOf = (input) => {
  return Object.prototype.toString.call(input).split(/\W/)[2];
};

export const AcIsBoolean = (value) =>
  AcGetTypeOf(value) === 'Boolean' || [true, false, 1, 0].includes(value);

export const AcIsFunction = (value) => AcGetTypeOf(value) === 'Function';

export const AcIsObject = (value) => AcGetTypeOf(value) === 'Object';

export const AcIsArray = (value) => AcGetTypeOf(value) === 'Array';

export const AcIsNull = (value) => value === null;

export const AcIsString = (value) => AcGetTypeOf(value) === 'String';

export const AcIsEmptyString = (value) =>
  AcGetTypeOf(value) === 'String' && value === '';

export const AcIsUndefined = (value) =>
  (value === undefined || typeof value === 'undefined') && value === void 0;

export const AcIsSet = (value) => !AcIsUndefined(value) && !AcIsNull(value);

export const AcIsNumeric = (value) => patterns.numeric.test(value);

export const AcIsAlphaNumeric = (value) => patterns.alphanumeric.test(value);

export const AcIsAlphabetical = (value) => patterns.alphabetical.test(value);

export const AcIsEmail = (value) => patterns.email.test(value);

export const AcIsPhoneNumber = (value) => patterns.phone.test(value);

export const AcIsSlimPostalCode = (value) =>
  patterns.slim_postal_code.test(value);

export const AcIsPostalCode = (value) => patterns.postal_code.test(value);

export default AcGetTypeOf;
