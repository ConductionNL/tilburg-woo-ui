import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import loadable from '@loadable/component';


const TilburgIntro = loadable(() => import('@components/tilburg-intro/tilburg-intro'));
const TilburgHero = loadable(() => import('@components/tilburg-hero/tilburg-hero'));
const TilburgSubjects = loadable(() => import('@components/tilburg-subjects/tilburg-subjects'));
const TilburgAbout = loadable(() => import('@components/tilburg-about/tilburg-about'));

const AcHome = ({ store: { faqs } }) => {
    return (
        <>
            <TilburgIntro />
            <TilburgHero />
            <TilburgSubjects />
            <TilburgAbout />

            <br/>

        </>
    );
};

export default withStore(observer(AcHome));
