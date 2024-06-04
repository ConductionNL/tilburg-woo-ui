import { useEffect, useMemo } from 'react';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';

import { TilburgCard, TilburgRichText } from '@atoms';
import { TilburgLink } from '@molecules';

const TilburgCta = ({ button, content, title, url }) => {
  useEffect(() => {
    console.log({ button, content, title, url });
  }, [button, content, title, url]);

  const renderButton = useMemo(() => {
    return (
      url &&
      button && (
        <TilburgLink href={url} type='button'>
          {button}
          <VISUALS.EXTERNAL_LINK_BLUE />
        </TilburgLink>
      )
    );
  }, [button, url]);

  return (
    <TilburgCard blue>
      <Heading level={2}>{title}</Heading>
      <TilburgRichText content={content} />
      {renderButton}
    </TilburgCard>
  );
};

export default TilburgCta;
