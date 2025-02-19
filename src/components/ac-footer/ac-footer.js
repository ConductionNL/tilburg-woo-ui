import { AcContainer } from '@atoms';
import { LABELS, VISUALS } from '@constants';
import {
  FOOTER_PRIMARY_ABOUT,
  FOOTER_PRIMARY_QUICK,
  FOOTER_SECONDARY,
} from '@constants/routes.constants';
import { Link } from 'react-router-dom';

const AcFooter = () => {
  const renderLink = (item) => {
    const linkContent = item.isExternal ? (
      <a href={item.href} target='_blank' rel='noopener noreferrer'>
        {item.label}
        <span className='sr-only'>Opent in een nieuw tabblad</span>
        <VISUALS.EXTERNAL_LINK />
      </a>
    ) : (
      <Link to={item.path}>{item.label}</Link>
    );

    return <li key={item.id}>{linkContent}</li>;
  };

  return (
    <footer className='ac-footer'>
      <h2 className='sr-only'>Footer</h2>
      <section>
        <AcContainer>
          <nav className='ac-footer__links' aria-label='Footer menu 1'>
            <h3>{LABELS.THIS_WEBSITE}</h3>
            <ul>{FOOTER_PRIMARY_ABOUT.map(renderLink)}</ul>
          </nav>
          <nav className='ac-footer__links' aria-label='Footer menu 2'>
            <h3>{LABELS.QUICK_LINKS}</h3>
            <ul>{FOOTER_PRIMARY_QUICK.map(renderLink)}</ul>
          </nav>
          <div className='ac-footer__logo'>
            <VISUALS.LOGO />
            <span>
              <span>Gemeente</span>
              <span>Éen plek voor alle publicaties van de Gemeente</span>
            </span>
          </div>
        </AcContainer>
      </section>
      <section>
        <AcContainer>
          <nav className='ac-footer__links' aria-label='Footer menu 3'>
            <ul>{FOOTER_SECONDARY.map(renderLink)}</ul>
          </nav>
        </AcContainer>
      </section>
    </footer>
  );
};

export default AcFooter;
