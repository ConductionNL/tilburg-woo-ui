// Imports => Constants
import { KEYS, ROUTES } from '@constants';

// Imports => Utilities
import { AcIsSet } from './ac-get-type-of';

const GetRoute = ({ entity }) => {
  let result = null;

  if (!AcIsSet(entity)) return null;

  const type = entity.replace(/-/g, '_').replace(/ /g, '_').toLowerCase();

  switch (type) {
    case KEYS.COMPANIES:
    case KEYS.COMPANY:
      result = ROUTES.COMPANY_DETAIL.path;
      break;

    case KEYS.CONFIGURATIONS:
    case KEYS.CONFIGURATION:
      result = ROUTES.CONFIGURATION_DETAIL.path;
      break;

    case KEYS.CONTRACTS:
    case KEYS.CONTRACT:
      result = ROUTES.CONTRACT_DETAIL.path;
      break;

    case KEYS.CONTROL_UNITS:
    case KEYS.CONTROL_UNIT:
      result = ROUTES.CONTROL_UNIT_DETAIL.path;
      break;

    case KEYS.HAMMERS:
    case KEYS.HAMMER:
      result = ROUTES.HAMMER_DETAIL.path;
      break;

    case KEYS.POWERPACKS:
    case KEYS.POWERPACK:
    case KEYS.POWER_PACKS:
    case KEYS.POWER_PACK:
      result = ROUTES.POWERPACK_DETAIL.path;
      break;

    case KEYS.PROJECTS:
    case KEYS.PROJECT:
      result = ROUTES.PROJECT_DETAIL.path;
      break;

    case KEYS.USERS:
    case KEYS.USER:
      result = ROUTES.USER_DETAIL.path;
      break;

    case KEYS.ALERTS:
    case KEYS.ALERT:
      result = ROUTES.OPERATIONAL_ALERTS_DETAIL.path;
      break;

    case KEYS.CONTROL_UNIT_TYPES:
      result = ROUTES.CONTROL_UNIT_TYPE_DETAIL.path;
      break;

    case KEYS.HAMMER_TYPES:
      result = ROUTES.HAMMER_TYPE_DETAIL.path;
      break;

    case KEYS.POWERPACK_TYPES:
      result = ROUTES.POWERPACK_TYPE_DETAIL.path;
      break;

    default:
  }

  return result;
};

export const AcFormatInternalURI = (link, value) => {
  if (!link || !value) return null;

  let route = GetRoute(link);

  if (route) {
    route = route.replace(':id', link.id);
  }

  return route;
};
