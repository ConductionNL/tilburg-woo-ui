// Imports => Utilities
import { AcIsArray } from '@utils';

const getGroupDisplayName = (group) => {
  let result = group;

  // Map group names to display names
  switch (group) {
    case 'admin':
      result = 'Administrator';
      break;
    case 'openregister':
      result = 'Open Register';
      break;
    case 'editor':
      result = 'Editor';
      break;
    case 'viewer':
      result = 'Viewer';
      break;
    case 'moderator':
      result = 'Moderator';
      break;
    default:
      // Capitalize first letter and replace underscores/hyphens with spaces
      result = group.charAt(0).toUpperCase() + group.slice(1).replace(/[_-]/g, ' ');
  }

  return result;
};

// Legacy function name for backward compatibility
const getRole = (role) => {
  return getGroupDisplayName(role);
};

// Format groups for display (new preferred method)
export const AcFormatGroup = (group) => {
  let result = group;
  const pattern = new RegExp(/\,/gi);

  if (AcIsArray(group) || pattern.test(group)) {
    const arr = AcIsArray(group) ? group : group.split(',');
    const len = arr.length;
    let n = 0;
    result = [];

    for (n; n < len; n++) {
      const line = arr[n].replace(/ /g, '');
      const formatted = getGroupDisplayName(line);
      if (formatted) result.push(formatted);
    }

    result = result.join('<br/>');
  } else {
    result = getGroupDisplayName(group);
  }

  return result;
};

// Legacy function for backward compatibility
export const AcFormatRole = (role) => {
  return AcFormatGroup(role);
};
