import { AcLockObject } from '@utils/ac-lock-object';

export const POSITIONS = AcLockObject({
  TOP: 'top',
  RIGHT: 'right',
  BOTTOM: 'bottom',
  LEFT: 'left',
});

export const SIZES = AcLockObject({
  SMALL: 'small',
  DEFAULT: 'default',
  MEDIUM: 'medium',
  LARGE: 'large',
});

export const THEMES = AcLockObject({
  ALPHA: 'alpha',
  ALPHA_LIGHT: 'alpha_light',
  OMEGA: 'omega',
  OMEGA_LIGHT: 'omega_light',
  OMEGA_DARK: 'omega_dark',
  BETA: 'beta',
  DEFAULT: 'default',
  TRANSPARENT: 'transparent',
  WHITE: 'white',
  LIGHT: 'light',
  SUBTLE: 'subtle',
  MEDIUM: 'medium',
  DARK: 'dark',
  PITCH: 'pitch',
  INFO: 'info',
  INFO_LIGHT: 'info_light',
});

export const TYPES = AcLockObject({
  BUTTON: 'button',
  SUBMIT: 'submit',
  RESET: 'reset',
  TEXT: 'text',
  TEXTAREA: 'textarea',
  PASSWORD: 'password',
  FILES: 'file',
  EMAIL: 'email',
  PHONENUMBER: 'phonenumber',
  DATE: 'date',
  BOLD: 'bold',
  LINK: 'link',
  ARRAY: 'array',
  LIST: 'list',
  STRING: 'string',
  IBAN: 'iban',
  OBJECT: 'object',
  ADDRESS: 'address',
});

export const VARIANTS = AcLockObject({
  OUTLINE: 'outline',
  DEFAULT: 'default',
  GHOST: 'ghost',
  TRANSPARENT: 'transparent',
  UPPERCASE: 'uppercase',
  LOWERCASE: 'lowercase',
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
});
