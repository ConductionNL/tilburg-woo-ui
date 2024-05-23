import React, { useEffect, useMemo } from 'react';
import {
	useLocation,
	useNavigate,
	useParams,
	generatePath,
	Link,
} from 'react-router-dom';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { Fade } from 'react-awesome-reveal';
import loadable from '@loadable/component';
import clsx from 'clsx';

// Imports => Config
import config from '@config';

// Imports => Constants
import { KEYS, ROUTES, TITLES } from '@constants';

// Imports => Utilities
import { AcSetDocumentTitle, AcGetHumanizedGreeting, AcIsSet } from '@utils';

// Imports => Components

// Imports => Atoms

const _CLASSES = {
	MAIN: 'ac-page ac-home',
};

let _delay = null;

const AcHome = ({ store: { conversations, news, profile } }) => {
	return <div>Hello Tilburg</div>;
};

export default withStore(observer(AcHome));
