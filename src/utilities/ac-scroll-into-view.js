export const AcScrollIntoView = (target, { behavior = 'smooth', block = 'end' } = {}) => {
	target.scrollIntoView({ behavior, block });
};

export default AcScrollIntoView;
