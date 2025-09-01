export class AcNavigator {
	constructor() {
		this.options = {
			enableHighAccuracy: true,
			timeout: 5000,
			maximumAge: 0,
		};

		this.permitted = false;

		this.currentLocation = {
			latitude: null,
			longitude: null,
		};

		this.init();
	}

	verify_permission = () => {
		return new Promise((resolve, reject) => {
			if (
				!process.browser ||
				!navigator.permissions ||
				!navigator.permissions.query
			) {
				reject('no permission');
			} else {
				navigator.permissions.query({ name: 'geolocation' }).then(status => {
					if (status.state === 'denied') {
						this.permitted = false;
						reject('no permission');
					} else if (status.state === 'granted') {
						this.permitted = true;
						resolve();
					}
				});
			}
		});
	};

	init = () => {
		return new Promise((resolve, reject) => {
			this.Navigator = navigator.geolocation;

			if (this.Navigator) {
				this.Navigator.getCurrentPosition(this.set, this.error, this.options);
				this.watch();
			}

			this.verify_permission();
		});
	};

	watch = () => {
		this.verify_permission()
			.then(() => {
				this.Navigator.watchPosition(this.set, this.error, this.options);
			})
			.catch(error => console.log(error));
	};

	set = object => {
		if (!object) return;

		const { coords } = object;
		const { latitude, longitude } = coords;

		this.currentLocation = {
			latitude,
			longitude,
		};
	};

	get = () => {
		return this.currentLocation;
	};

	error = err => {};
}

export default AcNavigator;
