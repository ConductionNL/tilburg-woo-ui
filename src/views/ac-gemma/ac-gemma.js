import { useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { useNavigate } from 'react-router';
import AcGemmaView from './ac-gemma-view';

const AcGemma = observer(() => {
  const navigate = useMemo(() => useNavigate(), []);
  const hostname = window.location.hostname;

  useEffect(() => {
    if (
      hostname !== 'localhost' &&
      hostname !== 'softwarecatalogus.accept.opencatalogi.nl' &&
      hostname !== 'softwarecatalogus.test.opencatalogi.nl' &&
      hostname !== 'acceptatie.softwarecatalogus.nl' &&
      hostname !== 'performance.accept.opencatalogi.nl'
    ) {
      navigate('/');
    }
  }, []);

  switch (hostname) {
    default:
      return <AcGemmaView />;
  }
});

export default withStore(AcGemma);
