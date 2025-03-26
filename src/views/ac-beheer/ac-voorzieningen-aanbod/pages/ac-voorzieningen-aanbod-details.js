import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

import { VISUALS } from '@constants';
import { AcContainer, AcFlex, AcSection } from '@atoms';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import AcColumn from '@atoms/ac-column/ac-column';
import { PrimaryActionButton } from '@utrecht/component-library-react';
import config from '@src/config';

import AcEditVoorzieningAanbodModal from '../modals/ac-edit-voorziening-aanbod-modal';
import AcDeleteVoorzieningAanbodModall from '../modals/ac-delete-voorziening-aanbod-modal';
import { useNavigate } from 'react-router';
import { AcLink } from '@src/molecules';
import { AcLoader } from '@src/components';

const AcBeheerVoorzieningenAanbodDetails = ({ id }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        //   config.authentication.baseURL +
        'https://vng.accept.commonground.nu/apps' +
          `/openconnector/api/endpoint/voorzieningaanboden/${id}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      setData(data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (error) {
    return (
      <AcSection>
        <AcContainer>
          <AcFlex column spacing='sm'>
            <AcLink href='/mijn-omgeving'>
              <VISUALS.ARROW_LEFT />
              Terug naar mijn omgeving
            </AcLink>

            <Heading level={1}>Er is een fout opgetreden</Heading>
            <Paragraph>
              Er kon geen verbinding worden gemaakt met de server. Probeer het later
              opnieuw.
            </Paragraph>
            <Paragraph>{error.message}</Paragraph>
          </AcFlex>
        </AcContainer>
      </AcSection>
    );
  }

  const [openModal, setOpenModal] = useState(null);

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='sm'>
          <AcLink href='/mijn-omgeving'>
            <VISUALS.ARROW_LEFT />
            Terug naar mijn omgeving
          </AcLink>

          {JSON.stringify(data)}

          {loading && <AcLoader />}
          {!loading && !data && <Heading>Er is een fout opgetreden</Heading>}
          {!loading && data && (
            <>
              <Heading>{data.name}</Heading>

              <AcFlex spacing='sm' justifyContent='end'>
                <PrimaryActionButton>Delete</PrimaryActionButton>
              </AcFlex>

              {/* modals */}
              {/* <AcEditVoorzieningAanbodModal
                voorziening={singleSelectedRow}
                showModal={openModal === 'edit'}
                onClose={() => {
                  setOpenModal(null);
                  setSingleSelectedRow(null);
                }}
                onSuccess={() => {
                  tableRef.current.resetSelectedRows();
                }}
              /> */}

              {/* <AcDeleteVoorzieningAanbodModall
                voorzieningen={
                  singleSelectedRow ? [singleSelectedRow] : selectedRows
                }
                showModal={openModal === 'delete'}
                onClose={() => {
                  setOpenModal(null);
                  setSingleSelectedRow(null);
                }}
                onSuccess={() => {
                  tableRef.current.resetSelectedRows();
                }}
              /> */}
            </>
          )}
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

export default withStore(observer(AcBeheerVoorzieningenAanbodDetails));
