import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import loadable from '@loadable/component';
import { useEffect } from 'react';

const TilburgCardCategory = loadable(() => import('@molecules/tilburg-card-category/tilburg-card-category'));
const TilburgIntro = loadable(() => import('@components/tilburg-intro/tilburg-intro'));
const TilburgHero = loadable(() => import('@components/tilburg-hero/tilburg-hero'));
const TilburgSubjects = loadable(() => import('@components/tilburg-subjects/tilburg-subjects'));
const TilburgFeatured = loadable(() => import('@components/tilburg-featured/tilburg-featured'));
const TilburgContainer = loadable(() => import('@atoms/tilburg-container/tilburg-container'));
const TilburgSearchResult = loadable(() => import('@molecules/tilburg-search-result/tilburg-search-result'));

// Imports => Atoms

const _CLASSES = {
    MAIN: 'ac-page ac-home',
};

const AcHome = ({ store: { faqs } }) => {

    const { fetchFaqs, all_faqs } = faqs

    // Fetch all faqs.
    useEffect(() => {
        fetchFaqs()
    }, []);

    return (
        <>
            <TilburgIntro />
            <TilburgHero />
            <TilburgSubjects />
            <TilburgFeatured />
            <div class="container">
                <br/>
                <br/>
                <br/>
                <br/>
                <h2>ABOUT SECTION W/ IMAGE</h2>
                <br/>
                <br/>
                <br/>
                <br/>
            </div>
        </>
    );
};

export default withStore(observer(AcHome));
