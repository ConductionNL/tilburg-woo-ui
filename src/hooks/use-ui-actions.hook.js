// Imports => Constants
import { KEYS } from '@constants';

// Imports => Utilities
import { AcIsSet } from '@utils';

export const useUIActions = (store, key, $ref) => {
	if (!AcIsSet(store)) {
		console.warn(
			`[hook] UseUIActions => store is not set. Please provide a valid MobX Store instance`
		);
		return;
	}

	if (!AcIsSet(key)) {
		console.warn(
			`[hook] UseUIActions => key is not set. Please provide a valid key to target the UI element`
		);
		return;
	}

	if (!AcIsSet($ref)) {
		console.warn(
			`[hook] UseUIActions => $ref is not set. Please provide a valid $ref to target the UI element`
		);
		return;
	}

	const handleOpen = (event) => {
		if (event?.preventDefault) event.preventDefault();
		if (event?.stopPropagation) event.stopPropagation();
		store.setValue(key, KEYS.VISIBLE, true);
	};

	const handleClose = (event) => {
		if (event?.preventDefault) event.preventDefault();
		if (event?.stopPropagation) event.stopPropagation();
		store.setValue(key, KEYS.VISIBLE, false);
	};

	const handleToggle = (event) => {
		if (event?.preventDefault) event.preventDefault();
		if (event?.stopPropagation) event.stopPropagation();
		if (store[key][KEYS.VISIBLE]) handleClose(event);
		else handleOpen(event);
	};

	const addEvents = () => {
		document.addEventListener('click', handleClick, false);
	};

	const removeEvents = () => {
		document.removeEventListener('click', handleClick, false);
	};

	const handleClick = (event) => {
		if (event && event.target) {
			const $element = $ref.current;

			if ($element) {
				const inside = $element.contains(event.target);

				if (!inside) handleClose();
			}
		}
	};

	return {
		handleOpen,
		handleClose,
		handleToggle,
		addEvents,
		removeEvents,
	};
};
