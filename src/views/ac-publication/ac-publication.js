import { useEffect } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { TilburgContainer } from '@atoms';
import { useParams } from 'react-router-dom';
import { TilburgLoader } from '@components';

const AcPublication = ({ store: { documents } }) => {
  const { id } = useParams();

  const { fetchDocument, get_single, loading } = documents;

  useEffect(() => {
    fetchDocument(id);
  }, [id]);

  useEffect(() => {
    console.log(get_single);

    document.title = get_single?.titel || 'Open Tilburg | Publicatie';
  }, [get_single]);

  if (loading.status) {
    return <TilburgLoader />;
  }

  return (
    <>
      <TilburgContainer margin='xl'>
        <Heading>{get_single?.titel}</Heading>
      </TilburgContainer>
    </>
  );
};

export default withStore(observer(AcPublication));
