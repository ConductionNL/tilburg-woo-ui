import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import loadable from '@loadable/component';
import clsx from 'clsx';

// Imports => Config
import config from '@config';

// Imports => Constants
import { KEYS, ROUTES, TITLES } from '@constants';

// Imports => Utilities

// Imports => NLDS components
import { Heading } from '@utrecht/component-library-react/dist/css-module'

// Imports => Components
const TilburgHero	 = loadable(() => import('@components/tilburg-hero/tilburg-hero'));
const TilburgSearchbox = loadable(() => import('@components/tilburg-searchbox/tilburg-searchbox'));
const TilburgFaq = loadable(() => import('@components/tilburg-faq/tilburg-faq'));
const TilburgContainer = loadable(() => import('@atoms/tilburg-container/tilburg-container'));
const TilburgCardIntro = loadable(() => import('@molecules/tilburg-card-intro/tilburg-card-intro'));
const TilburgSearchResult = loadable(() => import('@molecules/tilburg-search-result/tilburg-search-result'));

// Imports => Atoms

const _CLASSES = {
	MAIN: 'ac-page ac-home',
};

const faqItems = [
	{
		label: "Question 1",
		body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla nec purus non nunc lacinia gravida"
	},
	{
		label: "Question 2",
		body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla nec purus non nunc lacinia gravida"
	},
	{
		label: "Question 3",
		body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla nec purus non nunc lacinia gravida"
	},
]
const AcHome = ({ store: { conversations, news, profile } }) => {
	return (
		<>
			<TilburgHero />

			<TilburgContainer>
				<Heading level={1}>Gemeente Tilburg</Heading>
				<TilburgSearchbox />
				<TilburgSearchbox small />
				<TilburgFaq faqItems={faqItems} />

				<TilburgCardIntro />

				<TilburgSearchResult />
			</TilburgContainer>

		</>
	);
};

export default withStore(observer(AcHome));
