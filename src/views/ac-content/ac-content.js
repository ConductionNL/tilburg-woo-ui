import { useEffect } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import loadable from '@loadable/component';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import TilburgSection from '@atoms/tilburg-section/tilburg-section';

const TilburgSectionsHandler = loadable(() => import('@components/tilburg-sections-handler/tilburg-sections-handler'));
const TilburgContainer = loadable(() => import('@atoms/tilburg-container/tilburg-container'));

const AcContent = ({ store: { pages } }) => {

    const { fetchPage, get_single } = pages;

    const slug = document.location.pathname;

    useEffect(() => {
        fetchPage(slug)
    }, []);

    return (
        <TilburgContainer compact>
            <Heading level={1}>{get_single?.name}</Heading>
            <TilburgSectionsHandler contents={get_single?.contents} />
        </TilburgContainer>
    );
}

export default withStore(observer(AcContent));
