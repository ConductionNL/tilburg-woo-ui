import { useMemo } from 'react';
import clsx from 'clsx';
import {
  Heading,
  Textbox,
  PrimaryActionButton,
  SecondaryActionButton,
} from '@utrecht/component-library-react/dist/css-module';
import { LABELS, VISUALS } from '@constants';

export const TilburgSearchbox = ({
  home,
  search,
  small,
  label,
  spacing,
  onSearchCallback,
}) => {
  const _CLASSES = clsx('tilburg-searchbox', {
    'tilburg-searchbox--home': home,
    'tilburg-searchbox--search': search,
    'tilburg-searchbox--small': small,
    'tilburg-searchbox--spacing': spacing,
  });

  const renderHeading = useMemo(() => {
    return label && <Heading level={2}>{label}</Heading>;
  }, [label]);

  const submitCallback = (e) => {
    console.log(e);
    e.preventDefault();
  };

  return (
    <form className={_CLASSES} onSubmit={submitCallback}>
      {renderHeading}

      <div class='tilburg-searchbox__search'>
        <Textbox placeholder={LABELS.ENTER_QUERY} />
        <PrimaryActionButton type='submit'>
          <VISUALS.SEARCH />
          {LABELS.SEARCH}
        </PrimaryActionButton>
      </div>

      {search && (
        <div class='tilburg-searchbox__actions'>
          <SecondaryActionButton>
            <VISUALS.FILTER />
            {LABELS.FILTER}
          </SecondaryActionButton>
        </div>
      )}
    </form>
  );
};

export default TilburgSearchbox;
