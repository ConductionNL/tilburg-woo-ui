import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import loadable from '@loadable/component';
import { useEffect } from 'react';

// Imports => Config
import config from '@config';

// Imports => Constants
import { KEYS, ROUTES, TITLES } from '@constants';

// Imports => Utilities

// Imports => NLDS components
import { Heading } from '@utrecht/component-library-react/dist/css-module'
import TilburgCardCategory from '@molecules/tilburg-card-category/tilburg-card-category'
import {Paragraph} from "@utrecht/component-library-react";

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

const AcHome = ({ store: { faqs } }) => {

	const { getAll, all_faqs } = faqs

	useEffect(() => {
		getAll()
	}, []);

	return (
		<>
			<TilburgHero />

			<TilburgContainer>
				<Heading level={1}>Gemeente Tilburg</Heading>
				<Paragraph>
					Lorem ipsum dolor sit amet, consectetur adipisicing elit.
					Explicabo facilis mollitia quam recusandae.
					Aut autem deleniti dicta dolorem doloremque ea labore magnam obcaecati officia placeat
					provident quidem quisquam, rerum vel.
				</Paragraph>

				<TilburgFaq faqItems={all_faqs} />

				<TilburgCardIntro />

				<TilburgSearchResult />

				<TilburgCardCategory />
			</TilburgContainer>

		</>
	);
};

export default withStore(observer(AcHome));
