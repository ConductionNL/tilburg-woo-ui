const customSelector = s => {
	let matches = (this.document || this.ownerDocument).querySelectorAll(s);
	let i = matches.length;
	while (--i >= 0 && matches.item(i) !== this) {}
	return i > -1;
};

export const AcGetClosestElement = (elem, selector) => {
	// Element.matches() polyfill
	if (!Element.prototype.matches) {
		Element.prototype.matches =
			Element.prototype.matchesSelector ||
			Element.prototype.mozMatchesSelector ||
			Element.prototype.msMatchesSelector ||
			Element.prototype.oMatchesSelector ||
			Element.prototype.webkitMatchesSelector ||
			customSelector;
	}

	// Get the closest matching element
	for (; elem && elem !== document; elem = elem.parentNode) {
		if (elem.matches(selector)) return elem;
	}
	return null;
};

export default AcGetClosestElement;
