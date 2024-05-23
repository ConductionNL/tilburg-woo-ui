// eslint-disable-next-line
Object.defineProperty(Array.prototype, 'chunk', {
	value: function(chunks) {
		let result = [];
		let i = 0;
		let size = Math.ceil(this.length / chunks);

		for (i; i < this.length; i += size) {
			result.push(this.slice(i, i + size));
		}
		return result;
	},
});
