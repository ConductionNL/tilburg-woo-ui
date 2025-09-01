import Classes from '@utils/ac-classes.js';

if (!Math.easeInOutQuad) {
	Math.easeInOutQuad = (t, b, c, d) => {
		t /= d / 2;
		if (t < 1) return (c / 2) * t * t + b;
		t--;
		return (-c / 2) * (t * (t - 2) - 1) + b;
	};
}

export class AcAsideNavigation {
	constructor($target, $container, $scroller, anchors, activeClass, scroll) {
		this.$target = $target;
		this.$container = $container;
		this.$scroller = $scroller ? $scroller : window;
		this.shouldScroll = scroll || false;

		this.anchors = anchors;
		this.activeClass = activeClass;
		this.activeAnchor = null;

		this.offset = 200;
		this.duration = 600;
		this.timer = null;

		this.Classes = new Classes();

		this.addEvents = this.addEvents.bind(this);
		this.handleKeyUp = this.handleKeyUp.bind(this);
		this.handleEvent = this.handleEvent.bind(this);
		this.scrollTo = this.scrollTo.bind(this);
		this.moveSpy = this.moveSpy.bind(this);
		this.scrollSpy = this.scrollSpy.bind(this);
		this.calculatePosition = this.calculatePosition.bind(this);
		this.setStyles = this.setStyles.bind(this);

		this.addEvents();
	}

	// Whenever a re-render takes place, we need to reset the anchors & eventlisteners.
	updateAnchors = (anchors) => {
		this.unload();
		this.anchors = anchors;

		const collection = this.anchors;
		const len = collection.length;
		let x = 0;

		for (x = 0; x < len; x++) {
			const anchor = collection[x];

			if (anchor.$ref) this.Classes.removeClass(anchor.$ref, this.activeClass);
		}

		this.addEvents();
	};

	unload = () => {
		if (this.$scroller) this.$scroller.removeEventListener('scroll', this.handleEvent, false);

		const collection = this.anchors;
		const len = collection.length;
		let x = 0;

		for (x = 0; x < len; x++) {
			const anchor = collection[x];

			if (anchor.$ref)
				anchor.$ref.removeEventListener(
					'click',
					(event) => {
						this.scrollTo(event, anchor, this.duration);
					},
					false
				);
		}

		if (document) document.removeEventListener('keyup', this.handleKeyUp, false);
	};

	addEvents = () => {
		if (this.$scroller) {
			this.$scroller.addEventListener('scroll', this.handleEvent, false);
			this.$scroller.dispatchEvent(new CustomEvent('scroll'));
		}

		const collection = this.anchors;
		const len = collection.length;
		let x = 0;

		for (x = 0; x < len; x++) {
			const anchor = collection[x];

			if (anchor.$ref)
				anchor.$ref.addEventListener(
					'click',
					(event) => {
						event.preventDefault();
						this.scrollTo(event, anchor, this.duration);
					},
					false
				);
		}

		if (document) document.addEventListener('keyup', this.handleKeyUp, false);
	};

	handleKeyUp = (event) => {
		const key = event.key || event.which;

		if (key) {
			switch (key) {
				case 'p':
				case 80:
					this.moveSpy('previous');
					break;

				case 'n':
				case 78:
					this.moveSpy('next');
					break;

				default:
			}
		}
	};

	handleEvent = (event) => {
		let scrollClient = this.$scroller.getBoundingClientRect();
		let scrollTop = this.$scroller.scrollTop - this.offset;

		let containerClient = this.$container.getBoundingClientRect();
		let containerTop = this.$container.offsetTop - this.offset;

		this.scrollSpy(event, scrollClient, scrollTop, containerClient, containerTop);

		if (this.shouldScroll) {
			this.calculatePosition(event, scrollClient, scrollTop, containerClient, containerTop);
		}
	};

	moveSpy = (direction) => {
		let anchor = false;

		if (this.activeAnchor === null && direction === 'next') {
			anchor = this.anchors[0];
		} else if (this.activeAnchor === null && direction === 'previous') {
			anchor = this.anchors[this.anchors.length - 1];
		} else {
			for (let x = 0; x < this.anchors.length; x++) {
				if (this.anchors[x].id === this.activeAnchor.id) {
					if (typeof this.anchors[x + (direction === 'next' ? 1 : -1)] !== 'undefined') {
						anchor = this.anchors[x + (direction === 'next' ? 1 : -1)];
					}
				}
			}
		}

		if (anchor) {
			this.scrollTo({}, anchor, this.duration / 2);
		}
	};

	scrollTo = (event, anchor, duration) => {
		clearTimeout(this.timer);

		this.activeAnchor = anchor;

		let rel = `${anchor.rel}-${anchor.id}`;
		let $section = document.getElementById(rel);

		if ($section) {
			let scrollClient = this.$scroller.getBoundingClientRect(),
				targetClient = $section.getBoundingClientRect(),
				start = this.$scroller.scrollTop,
				to = targetClient.top - (scrollClient.height / 2 - targetClient.height / 2),
				change = to,
				currentTime = 0,
				increment = 20;

			const animateScroll = () => {
				currentTime += increment;
				let val = Math.easeInOutQuad(currentTime, start, change, duration);

				this.$scroller.scrollTop = val;

				if (currentTime < duration) {
					this.timer = setTimeout(animateScroll, increment);
				}
			};
			animateScroll();
		}
	};

	scrollSpy = (event, scrollClient, scrollTop, containerClient, containerTop) => {
		let activeAnchor = false;
		const len = this.anchors.length;
		let x = 0;

		for (x; x < len; x++) {
			let anchor = this.anchors[x];
			let rel = `${anchor.rel}-${anchor.id}`;

			let $section = document.getElementById(rel);

			if ($section) {
				let targetClient = $section.getBoundingClientRect();

				let active =
					targetClient.top > scrollClient.top && scrollClient.bottom > targetClient.bottom;

				if (active) {
					activeAnchor = true;
					this.activeAnchor = anchor;
					setTimeout(() => {
						requestAnimationFrame(() => {
							this.Classes.addClass(anchor.$ref, this.activeClass);
						});
					}, 1000 / 60); // attempt to keep the fps on 60
				} else {
					setTimeout(() => {
						requestAnimationFrame(() => {
							this.Classes.removeClass(anchor.$ref, this.activeClass);
						});
					}, 1000 / 60); // attempt to keep the fps on 60
				}
			}
		}

		if (!activeAnchor) {
			this.activeAnchor = null;
		}
	};

	calculatePosition = (event, scrollClient, scrollTop, containerClient, containerTop) => {
		let update = false;

		let targetClient = this.$target.getBoundingClientRect();

		let result = {
			translateY: 0,
		};

		let targetOffset = scrollClient.height / 2 - targetClient.height / 2;

		let position = {
			top: containerClient.top - targetOffset - this.offset,
			bottom: containerClient.bottom - targetClient.height - targetOffset - this.offset,
		};

		if (scrollClient.top < position.top) {
			result.translateY = 0;
			update = true;
			this.Classes.removeClass(this.$target, 'ac-aside-navigation--sticky');
		} else if (scrollClient.top > position.top && scrollClient.top < position.bottom) {
			result.translateY = scrollTop - containerTop + targetOffset;
			update = true;
			this.Classes.addClass(this.$target, 'ac-aside-navigation--sticky');
		} else if (scrollClient.top >= position.bottom) {
			result.translateY = containerClient.height - targetClient.height;
			update = true;
			this.Classes.removeClass(this.$target, 'ac-aside-navigation--sticky');
		}

		if (update) {
			this.setStyles(result);
		}
	};

	setStyles = (styles) => {
		setTimeout(() => {
			requestAnimationFrame(() => {
				this.$target.style.transform = `translateZ(0) translateY(${styles.translateY}px)`;
			});
		}, 1000 / 60); // attempt to keep the fps on 60
	};
}

export default AcAsideNavigation;
