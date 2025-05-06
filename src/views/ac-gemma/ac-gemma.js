import { useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';
import { AcLoader } from '@components';
import { withStore } from '@stores';
import { useNavigate } from 'react-router';
import AcGemmaAccept from './ac-gemma-accept';
import AcGemmaTest from './ac-gemma-test';

const AcGemma = observer(({ store: { gemma } }) => {
  const { id } = useParams();
  const navigate = useMemo(() => useNavigate(), []);
  const hostname = window.location.hostname;

  useEffect(() => {
    if (
      hostname !== 'localhost' &&
      hostname !== 'vng.accept.commonground.nu' &&
      hostname !== 'vng.test.commonground.nu'
    ) {
      console.log(hostname);
      navigate('/');
    }
  }, []);

  switch (hostname) {
    // return console.log('localhost');
    case 'vng.accept.commonground.nu':
      return <AcGemmaAccept />;
    case 'localhost':
    case 'vng.test.commonground.nu':
      return <AcGemmaTest />;
  }
});

export default withStore(AcGemma);
