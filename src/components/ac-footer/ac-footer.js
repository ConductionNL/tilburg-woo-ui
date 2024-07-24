import { VISUALS } from '@constants';
import { AcContainer } from '@atoms';

const AcFooter = () => {
  return (
    <footer className='ac-footer'>
      <h2 className='sr-only'>Footer</h2>
      <AcContainer>
        <nav className='ac-footer__links' aria-label='Footer menu 1'>
          <h3>Deze website</h3>
          <ul>
            <li>
              <a href='/over-ons'>Over Open Tilburg</a>
            </li>
            <li>
              <a href='/contact'>Contact</a>
            </li>
            <li>
              <a href='/toegankelijkheid'>Toegankelijkheid</a>
            </li>
            <li>
              <a href='/zoeken'>Uitgebreid zoeken</a>
            </li>
            <li>
              <a href='/onderwerpen'>Onderwerpen</a>
            </li>
          </ul>
        </nav>
        <nav className='ac-footer__links' aria-label='Footer menu 2'>
          <h3>Snel naar</h3>
          <ul>
            <li>
              <a href='https://www.tilburg.nl' target='_blank'>
                www.tilburg.nl
                <span class='sr-only'>Opent in een nieuw tabblad</span>
                <VISUALS.EXTERNAL_LINK />
              </a>
            </li>
            <li>
              <a href='/' target='_blank'>
                Privacy
                <span class='sr-only'>Opent in een nieuw tabblad</span>
                <VISUALS.EXTERNAL_LINK />
              </a>
            </li>
            <li>
              <a href='/' target='_blank'>
                Proclaimer
                <span class='sr-only'>Opent in een nieuw tabblad</span>
                <VISUALS.EXTERNAL_LINK />
              </a>
            </li>
            <li>
              <a href='/' target='_blank'>
                Cookies
                <span class='sr-only'>Opent in een nieuw tabblad</span>
                <VISUALS.EXTERNAL_LINK />
              </a>
            </li>
          </ul>
        </nav>
        <div class='ac-footer__logo'>
          <VISUALS.LOGO />
          <span>
            <span>Open Tilburg</span>
            <span>Éen plek voor alle publicaties van Gemeente Tilburg</span>
          </span>
        </div>
      </AcContainer>
    </footer>
  );
};

export default AcFooter;
