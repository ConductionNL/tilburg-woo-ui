import { useEffect } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import loadable from '@loadable/component';
import { useLocation} from 'react-router-dom';

import { Heading } from '@utrecht/component-library-react/dist/css-module';


const TilburgSectionsHandler = loadable(() => import('@components/tilburg-sections-handler/tilburg-sections-handler'));
const TilburgContainer = loadable(() => import('@atoms/tilburg-container/tilburg-container'));

const AcContent = ({ store: { pages } }) => {

    const { fetchPage, get_single } = pages;

    const location = useLocation();

    useEffect(() => {
        fetchPage(location?.pathname)
    }, [location]);

    return (
        <TilburgContainer compact>
            <Heading level={1}>{get_single?.name}</Heading>
            <TilburgSectionsHandler contents={get_single?.contents} />
        </TilburgContainer>
    );
}

export default withStore(observer(AcContent));
