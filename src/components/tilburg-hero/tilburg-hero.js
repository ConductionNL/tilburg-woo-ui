import clsx from 'clsx';
import { VISUALS } from '@constants';
import { TilburgCard, TilburgContainer } from '@atoms';
import { TilburgSearchbox } from '@components';
import { TilburgLink } from '@molecules';

const TilburgHero = () => {
  const _CLASSES = clsx('tilburg-hero');
  return (
    <section
      className={_CLASSES}
      style="background-image: url('/home-hero-background.png');"
    >
      <TilburgContainer>
        <TilburgCard blue padding='lg'>
          <TilburgSearchbox home label='Waar ben je naar op zoek?' />
          <TilburgLink href='/test'>
            Uitgebreid zoeken
            <VISUALS.ARROW_RIGHT />
          </TilburgLink>
        </TilburgCard>
      </TilburgContainer>
    </section>
  );
};

export default TilburgHero;
