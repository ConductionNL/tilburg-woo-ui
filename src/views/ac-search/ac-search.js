import TilburgContainer from '@atoms/tilburg-container/tilburg-container';
import TilburgSearchbox from '@components/tilburg-searchbox/tilburg-searchbox';
import TilburgSearchResult from '@molecules/tilburg-search-result/tilburg-search-result';
import clsx from 'clsx';
import TilburgFlex from '@atoms/tilburg-flex/tilburg-flex';

const AcSearch = ({ store }) => {

    return (
        <>
            <TilburgContainer>
                <TilburgSearchbox label="Zoeken" spacing />
            </TilburgContainer>

            <TilburgContainer>
                <TilburgFlex column spacing="sm">
                    <TilburgSearchResult />
                    <TilburgSearchResult />
                    <TilburgSearchResult />
                    <TilburgSearchResult />
                </TilburgFlex>
            </TilburgContainer>
        </>
    )
}

export default AcSearch
