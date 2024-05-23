let AcWEBPSupportResult = null;

export const AcSupportsWEBP = () => {
	if (AcWEBPSupportResult !== null) return AcWEBPSupportResult;

	let result = false;
	const elem = document.createElement('canvas');

	if (!!(elem.getContext && elem.getContext('2d'))) {
		// was able or not to get WebP representation
		result = elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
	}

	AcWEBPSupportResult = result;

	// very old browser like IE 8, canvas not supported
	return result;
};

export default AcSupportsWEBP;
