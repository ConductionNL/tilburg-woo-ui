import { AcClasses } from './ac-classes';

export class AcIndicator {
	constructor($navigation, $indicator, routes, classNames) {
		this.$navigation = $navigation.current;
		this.$indicator = $indicator.current;
		this.routes = routes;
		this.classNames = classNames;

		this.active = 0;
		this.resize_delay = null;

		this.direction = 'left';
		this.position = {
			left: 0,
			right: '100%',
		};

		this.Classes = new AcClasses();

		this.init();
	}

	init = () => {
		this.reset();
		this.addEvents();
	};

	addEvents = () => {
		let n = 0;
		let len = this.routes.length;

		for (n; n < len; n++) {
			const route = this.routes[n];
			route.index = n;

			if (route.$ref) {
				route.$ref.addEventListener(
					'click',
					(event) => {
						this.recalculate(event, route);
					},
					false
				);
			}
		}

		window.addEventListener('resize', this.handleResize, { passive: true });
	};

	unload = () => {
		let n = 0;
		let len = this.routes.length;

		for (n; n < len; n++) {
			const route = this.routes[n];

			if (route.$ref)
				route.$ref.removeEventListener(
					'click',
					(event) => {
						this.recalculate(event, route);
					},
					false
				);
		}

		window.removeEventListener('resize', this.handleResize, { passive: true });
	};

	handleResize = (event) => {
		if (this.resize_delay) clearTimeout(this.resize_delay);

		this.resize_delay = setTimeout(() => {
			window.requestAnimationFrame(() => {
				this.recalculate(event, this.routes[this.active]);
			});
		}, 100);
	};

	update = (routes) => {
		this.$routes = routes;
		this.init();
	};

	reset = () => {
		this.active = 0;

		if (this.position.left >= window.outerWidth / 2) {
			this.direction = 'right';
			this.position = {
				left: '100%',
				right: 0,
			};
		} else {
			this.direction = 'left';
			this.position = {
				left: 0,
				right: '100%',
			};
		}

		this.move();
	};

	recalculate = (event, route) => {
		if (window.outerWidth <= 480) return;
		const offset = this.$navigation.getBoundingClientRect();
		const rect = route.$ref.getBoundingClientRect();

		const target = {
			left: rect.left - offset.left,
			right: offset.right - rect.right,
			direction:
				this.active > route.index
					? 'left'
					: this.active < route.index
					? 'right'
					: 'left',
		};

		this.active = route.index;

		this.position.left = target.left;
		this.position.right = target.right;
		this.direction = target.direction;

		this.move();
	};

	move = () => {
		if (!this.$indicator) return;

		if (this.direction !== this.last_direction) {
			if (this.direction === 'left') {
				this.Classes.removeClass(this.$indicator, this.classNames.RIGHT);
				this.Classes.addClass(this.$indicator, this.classNames.LEFT);
			} else if (this.direction === 'right') {
				this.Classes.removeClass(this.$indicator, this.classNames.LEFT);
				this.Classes.addClass(this.$indicator, this.classNames.RIGHT);
			}
			this.last_direction = this.direction;
		}

		window.requestAnimationFrame(() => {
			const left =
				this.position.left === '100%'
					? this.position.left
					: `${this.position.left}px`;
			const right =
				this.position.right === '100%'
					? this.position.right
					: `${this.position.right}px`;

			this.$indicator.setAttribute('style', `left: ${left}; right: ${right}`);
		});
	};
}
