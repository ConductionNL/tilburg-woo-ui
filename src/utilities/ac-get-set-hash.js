export const AcSetHash = (hash) => {
	if (window.history && window.history.replaceState) {
		window.history.replaceState(
			null,
			document.title,
			`${window.location.pathname}#${hash}${window.location.search}`
		);
	}
};

export const AcGetHash = () => {
	let hash = null;

	if (window && window.location) {
		hash = window.location.hash || null;
		if (hash) hash = hash.replace('#', '');
	}

	return hash;
};

export const AcRemoveHash = () => {
	if (window.history && window.history.replaceState) {
		window.history.replaceState(
			'',
			document.title,
			`${window.location.pathname}${window.location.search}`
		);
	}
};
