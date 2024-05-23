// Imports => Utilities
import { AcIsSet } from '@utils';

export class User {
	constructor(store) {
		this.store = store;
	}

	is = (role) => {
		const { current_roles } = this.store;
		if (!AcIsSet(current_roles)) return false;

		return current_roles.indexOf(role) > -1;
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
