// Imports => React

import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';


// Imports => SCSS
import '@styles/index.scss';

// Imports => Config
import config from '@config';

// Imports => Constants
import {
	DEFAULT_ROUTE,
} from '@constants';

// Imports => Utilities
import { AcHome } from '@views'
import loadable from '@loadable/component'

// Imports => Molecules
const TilburgHeader = loadable(() => import('@components/tilburg-header/tilburg-header'));
const TilburgFooter = loadable(() => import('@components/tilburg-footer/tilburg-footer'));

// Imports => Atoms

const _CLASSES = {
	ROOT: 'ac-root',
	MAIN: 'ac-app',
	ROUTE: {
		SECTION: 'ac-route__section',
		HIDDEN: 'ac-route__section--hidden',
	},
};

const App = ({ store }) => {
	return (
		<div class="tilburg-theme">
			<TilburgHeader />

			<main id="main">
				<Routes>
					<Route
						key={`default-route-${DEFAULT_ROUTE.id}`}
						path={'*'}
						element={
							<AcHome store={store} />
						}
					/>
				</Routes>
			</main>

			<TilburgFooter />
		</div>
	);
};

export default withStore(observer(App));
