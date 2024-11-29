import { AcContainer, AcLogo } from '@atoms';
import { LABELS, VISUALS } from '@constants';
import { EXTERNAL_LINKS, FOOTER_ITEMS } from '@constants/routes.constants';
import { Link } from 'react-router-dom';

const AcFooter = () => {
  return (
    <footer className='ac-footer'>
      <h2 className='sr-only'>Footer</h2>
      <AcContainer>
        <nav className='ac-footer__links' aria-label='Footer menu 1'>
          <h3>{LABELS.THIS_WEBSITE}</h3>
          <ul>
            {FOOTER_ITEMS.map((item, index) => (
              <li key={index}>
                <Link to={item.path}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav className='ac-footer__links' aria-label='Footer menu 2'>
          <h3>{LABELS.QUICK_LINKS}</h3>
          <ul>
            {EXTERNAL_LINKS.map((item, index) => (
              <li>
                <a href={item.href} target='_blank'>
                  {item.label}
                  <span className='sr-only'>Opent in een nieuw tabblad</span>
                  <VISUALS.EXTERNAL_LINK />
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div class='ac-footer__logo'>
          <AcLogo variant='footer' />
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
