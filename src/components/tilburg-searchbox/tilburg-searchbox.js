import { useMemo } from 'react';
import clsx from 'clsx';
import {
  Textbox,
  PrimaryActionButton,
  Heading,
} from '@utrecht/component-library-react/dist/css-module';
import { LABELS, VISUALS } from '@constants';

export const TilburgSearchbox = ({
  small,
  home,
  label,
  spacing,
  onSearchCallback,
}) => {
  const _CLASSES = clsx('tilburg-searchbox', {
    'tilburg-searchbox--small': small,
    'tilburg-searchbox--home': home,
    'tilburg-searchbox--spacing': spacing,
  });

  const renderHeading = useMemo(() => {
    return label && <Heading level={2}>{label}</Heading>;
  }, [label]);

  const submitCallback = (e) => {
    console.log(e);
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
    </form>
  );
};

export default TilburgSearchbox;
