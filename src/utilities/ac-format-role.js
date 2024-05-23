// Imports => Constants
import { ROLES } from '@constants';

// Imports => Utilities
import { AcIsArray } from '@utils';

const getRole = (role) => {
  let result = role;

  switch (role) {
    case ROLES.CHUCK_NORRIS:
      result = 'Super admin';
      break;

    case ROLES.ADMIN:
      result = 'Admin';
      break;

    case ROLES.RENTAL_COORDINATOR:
      result = 'Rental Coordinator';
      break;

    case ROLES.COMPANY_ADMIN:
      result = 'Company Admin';
      break;

    case ROLES.SERVICE_ENGINEER:
      result = 'Service Engineer';
      break;

    case ROLES.OPERATOR:
      result = 'Operator';
      break;

    case ROLES.USER:
      result = 'User';
      break;
    case ROLES.CDE:
      result = 'Client Desk Engineer';
      break;
    default:
      result = null;
  }

  return result;
};

export const AcFormatRole = (role) => {
  let result = role;
  const pattern = new RegExp(/\,/gi);

  if (AcIsArray(role) || pattern.test(role)) {
    const arr = AcIsArray(role) ? role : role.split(',');
    const len = arr.length;
    let n = 0;
    result = [];

    for (n; n < len; n++) {
      const line = arr[n].replace(/ /g, '');
      const formatted = getRole(line);
      if (formatted) result.push(formatted);
    }

    result = result.join('<br/>');
  } else {
    result = getRole(role);
  }

  return result;
};
