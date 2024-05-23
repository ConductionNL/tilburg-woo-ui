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

// Imports => Data
import { DIRECT_ACTIONS } from '@data/direct-actions.data';

// Imports => Constants
import { KEYS, ROUTES, TITLES } from '@constants';

// Imports => Utilities
import { AcSetDocumentTitle, AcGetHumanizedGreeting, AcIsSet } from '@utils';

// Imports => Components
const AcActionCard = loadable(() =>
	import('@components/ac-action-card/ac-action-card')
);
const AcArticleCard = loadable(() =>
	import('@components/ac-article-card/ac-article-card')
);
const AcConversationsList = loadable(() =>
	import('@components/ac-conversations-list/ac-conversations-list')
);

// Imports => Atoms
import { AcContainer, AcRow, AcColumn } from '@atoms/ac-grid';
const AcHeading = loadable(() => import('@atoms/ac-heading/ac-heading'));
const AcCard = loadable(() => import('@atoms/ac-card/ac-card'));
const AcLoader = loadable(() => import('@atoms/ac-loader/ac-loader'));

const _CLASSES = {
	MAIN: 'ac-page ac-home',
};

let _delay = null;

const AcHome = ({ store: { conversations, news, profile } }) => {
	const location = useLocation();
	const navigate = useNavigate();
	const params = useParams();

	const { current_profile } = profile;

	useEffect(() => {
		AcSetDocumentTitle(TITLES.HOME);
	}, []);

	useEffect(() => {
		news.index();
	}, []);

	const isLoading = useMemo(() => {
		return news.is_loading || conversations.is_loading;
	}, [news.is_loading, conversations.is_loading]);

	const handleGoToConversation = async (event, item) => {
		if (event?.preventDefault) event.preventDefault();
		if (event?.stopPropagation) event.stopPropagation();

		if (!AcIsSet(item)) return;

		conversations.reset(KEYS.CONVERSATION);

		if (item.is_unread) await conversations.mark_as_read(item.id);

		_delay = setTimeout(() => {
			window.requestAnimationFrame(() => {
				const route = generatePath(ROUTES.CONVERSATION.path, { id: item.id });
				navigate(route);
			});
		}, 1000 / 60);
	};

	const userIsResident = useMemo(() => {
		return (
			AcIsSet(current_profile) &&
			AcIsSet(current_profile?.rental_object) &&
			AcIsSet(current_profile?.active_subscription)
		);
	}, [current_profile]);

	const userIsMember = useMemo(
		() => !userIsResident,
		[current_profile, userIsResident]
	);

	const getHumanizedGreeting = useMemo(() => {
		const greeting = AcGetHumanizedGreeting();

		return greeting;
	}, []);

	const renderTitle = useMemo(() => {
		if (!current_profile?.full_name)
			return <AcHeading rank={2}>{getHumanizedGreeting}</AcHeading>;

		const {
			current_profile: { full_name },
		} = profile;

		return (
			<>
				<AcHeading rank={2}>{getHumanizedGreeting}</AcHeading>
				<AcHeading rank={1}>{`${full_name},`}</AcHeading>
			</>
		);
	}, [getHumanizedGreeting, current_profile]);

	const renderSubTitle = useMemo(() => {
		return (
			<AcHeading rank={2} tag={'h2'}>
				welkom terug, wat wil je doen?
			</AcHeading>
		);
	}, []);

	const renderActions = useMemo(() => {
		const collection = DIRECT_ACTIONS;
		const len = collection.length;
		let n = 0;
		let result = [];

		for (n; n < len; n++) {
			const item = collection[n];

			const additional = {};

			if (userIsMember && item.type === 'news') continue;

			if (AcIsSet(item.extra) && item.extra === 'unread_messages') {
				additional.unread_messages =
					conversations.current_number_of_unread_conversations;
			}

			const object = (
				<Fade key={`ac-action-card-fade--${item.id}`} duration={200} triggerOnce>
					<AcActionCard
						{...item}
						additional={additional}
						key={`ac-action-card--${item.id}`}
					/>
				</Fade>
			);

			result.push(object);
		}

		return <div className={'ac-action-card-wrp'}>{result}</div>;
	}, [conversations.current_number_of_unread_conversations, userIsMember]);

	const renderRecentConversations = useMemo(() => {
		if (!AcIsSet(conversations.current_recent_conversations)) return null;

		return (
			<AcConversationsList
				collection={conversations.current_recent_conversations || []}
				callback={handleGoToConversation}
			/>
		);
	}, [conversations.current_recent_conversations, handleGoToConversation]);

	const renderRecentNewsArticles = useMemo(() => {
		if (userIsMember) return null;
		if (!AcIsSet(news.current_recent_articles)) return null;

		const collection = news.current_recent_articles || [];
		const len = collection.length;
		let n = 0;
		let result = [];

		for (n; n < len; n++) {
			const item = collection[n];

			const object = <AcArticleCard key={`ac-article-card--${item.id}`} {...item} />;

			result.push(object);
		}

		return (
			<div className={'ac-article-card-wrp'}>
				<Fade duration={200} triggerOnce>
					{result}
				</Fade>
			</div>
		);
	}, [news.current_recent_articles, userIsResident, userIsMember]);

	const getMainClassNames = useMemo(() => {
		return clsx(_CLASSES.MAIN);
	}, []);

	return (
		<div className={getMainClassNames}>
			<AcContainer>
				<AcRow>
					<AcColumn xs={12}>{renderTitle}</AcColumn>
				</AcRow>

				<AcRow className={'h-margin-bottom-25'}>
					<AcColumn xs={12}>{renderSubTitle}</AcColumn>
				</AcRow>

				{renderActions}

				{conversations.current_recent_conversations && (
					<>
						<AcRow className={'h-margin-top-45'}>
							<AcColumn xs={12} sm={12} md={8} lg={6}>
								<AcHeading rank={3}>
									<span>Recente meldingen</span>
									<Link
										to={ROUTES.CONVERSATIONS.path}
										title={'Bekijk alle meldingen'}
									>
										<span>Alle meldingen bekijken</span>
									</Link>
								</AcHeading>
							</AcColumn>
						</AcRow>

						<AcRow>
							<AcColumn xs={12} sm={12} md={10} lg={8}>
								{renderRecentConversations}
							</AcColumn>
						</AcRow>
					</>
				)}

				{userIsResident && news.current_recent_articles && (
					<>
						<AcRow className={'h-margin-top-45'}>
							<AcColumn xs={12} sm={12} md={10} lg={10}>
								<AcHeading rank={3}>
									<span>Het laatste nieuws</span>
									<Link
										to={ROUTES.NEWS.path}
										title={'Bekijk al het Elck Wat Wils nieuws'}
									>
										<span>Al het nieuws bekijken</span>
									</Link>
								</AcHeading>
							</AcColumn>
						</AcRow>

						<AcRow>
							<AcColumn xs={12} sm={12} md={10} lg={10}>
								{renderRecentNewsArticles}
							</AcColumn>
						</AcRow>
					</>
				)}
			</AcContainer>

			{isLoading && <AcLoader loading={true} cover />}
		</div>
	);
};

export default withStore(observer(AcHome));
