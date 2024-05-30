import { useEffect } from 'react';

import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

import TilburgBlockHandler from '@components/tilburg-block-handler/tilburg-block-handler';

const AcContent = ({ store: { pages } }) => {

    const { fetchPage, get_single } = pages;

    const slug = document.location.pathname;

    useEffect(() => {
        fetchPage(slug)
        console.log('slug:' + slug)
    }, []);

    return (
        <>
            <TilburgBlockHandler contents={get_single?.contents} />
        </>
    )
}

export default withStore(observer(AcContent));
