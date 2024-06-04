import { TilburgContainer, TilburgFlex } from '@atoms';
import { TilburgSearchResult } from '@molecules';
import { TilburgSearchbox } from '@components';
import { LABELS } from '@constants';

const AcSearch = ({ store }) => {

    return (
        <>
            <TilburgContainer>
                <TilburgSearchbox label={LABELS.SEARCH} spacing />
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
