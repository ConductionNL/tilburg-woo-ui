import { useEffect, useMemo } from 'react';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';

import { AcCard, AcRichText } from '@atoms';
import { AcLink } from '@molecules';

const AcCta = ({ button, content, title, url }) => {
  useEffect(() => {
    console.log({ button, content, title, url });
  }, [button, content, title, url]);

  const renderButton = useMemo(() => {
    return (
      url &&
      button && (
        <AcLink href={url} type='button'>
          {button}
          <VISUALS.EXTERNAL_LINK_BLUE />
        </AcLink>
      )
    );
  }, [button, url]);

  return (
    <AcCard blue>
      <Heading level={2}>{title}</Heading>
      <AcRichText content={content} />
      {renderButton}
    </AcCard>
  );
};

export default AcCta;
