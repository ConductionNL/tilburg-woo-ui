import { useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';
import { withStore } from '@stores';
import { useNavigate } from 'react-router';
import AcGemmaView from './ac-gemma-view';

const AcGemma = observer(({ store: { gemma } }) => {
  const { id } = useParams();
  const navigate = useMemo(() => useNavigate(), []);
  const hostname = window.location.hostname;

  useEffect(() => {
    if (
      hostname !== 'localhost' &&
      hostname !== 'softwarecatalogus.test.opencatalogi.nl' &&
      hostname !== 'softwarecatalogus.accept.opencatalogi.nl' &&
      hostname !== 'acceptatie.softwarecatalogus.nl'
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
