// Imports => React
import React, { useEffect, useState, useMemo, useRef, memo } from 'react';
import loadable from '@loadable/component';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import ReactCSSTransitionReplace from 'react-css-transition-replace';
import clsx from 'clsx';

// Imports => SCSS
import '@styles/index.scss';

// Imports => Config
import config from '@config';

// Imports => Constants
import {
	DASHBOARD_ROUTES,
	DEFAULT_ROUTE,
	ICONS,
	KEYS,
	PERMISSIONS,
	ROLES,
	ROUTES,
	THEMES,
	TITLES,
} from '@constants';

// Imports => Utilities
import { AcIsSet, AcSetDocumentTitle } from '@utils';

// Imports => Molecules
// const AcFooter = loadable(() => import('@components/ac-footer/ac-footer.web'));

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
	return <div />;
};

export default withStore(observer(App));
