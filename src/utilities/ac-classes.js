export class AcClasses {
	hasClass = (elem, className) => {
		if (!elem) return;
		return new RegExp(' ' + className + ' ').test(' ' + elem.className + ' ');
	};

	addClass = (elem, className) => {
		if (!elem) return;
		if (!this.hasClass(elem, className)) {
			elem.className += ' ' + className;
		}
	};

	removeClass = (elem, className) => {
		if (!elem) return;
		var newClass = ' ' + elem.className.replace(/[\t\r\n]/g, ' ') + ' ';
		if (this.hasClass(elem, className)) {
			while (newClass.indexOf(' ' + className + ' ') >= 0) {
				newClass = newClass.replace(' ' + className + ' ', ' ');
			}
			elem.className = newClass.replace(/^\s+|\s+$/g, '');
		}
	};
}

export default AcClasses;
