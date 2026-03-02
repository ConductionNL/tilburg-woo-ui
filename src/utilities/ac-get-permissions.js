// Imports => Utilities
import { AcIsSet } from '@utils';

export class User {
	constructor(store) {
		this.store = store;
	}

	// Updated to use groups instead of roles
	is = (group) => {
		const { current_groups } = this.store;
		if (!AcIsSet(current_groups)) return false;

		return current_groups.indexOf(group) > -1;
	};

	// Alias for backward compatibility
	hasRole = (group) => {
		return this.is(group);
	};

	hasGroup = (group) => {
		return this.is(group);
	};

	can = (permission, or) => {
		const { current_permissions } = this.store;
		if (!AcIsSet(current_permissions)) return false;

		return current_permissions[permission] || current_permissions[or];
	};

	cannot = (permission) => {
		return this.can(permission);
	};
}

export const AcCreateUser = (store) => new User(store);
