import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { AcFlex } from '@atoms';
import { Alert, Paragraph } from '@utrecht/component-library-react/dist/css-module';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { BASE_URL } from '../../ac-beheer';
import { VISUALS } from '@constants';
import _ from 'lodash';

/**
 * Modal to invite users to join the organization
 * @param {object[]} contactpersonen - array of users to invite
 * @param {boolean} showModal - boolean to check if the modal is shown
 * @param {function} onClose - function to call when the modal is closed
 * @param {function} onSuccess - function to call when invitation is successful
 * @returns {React.JSX.Element} - modal to invite users
 */
const AcContactpersonenUitnodigenModal = ({
  contactpersonen,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);
  const { makeRequest } = useNextcloudRequests();

  /** @type {[
    { type: 'error' | 'info' | 'success', message: string } | null,
    (state: { type: 'error' | 'info' | 'success', message: string } | null) => void
  ]} */
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [contactpersonenCopy, setContactpersonenCopy] = useState([]);

  const handleOpenModal = () => modalRef?.current?.showModal();

  // I think this is good possible endpoint, but the function is not implemented yet
  const endpoint = 'openregister/api/objects/voorzieningen/contactpersoon/invite';

  const handleInviteUsers = async () => {
    try {
      setIsLoading(true);

      await Promise.all(
        contactpersonenCopy.map(async (contactpersoon) => {
          const response = await makeRequest(`${BASE_URL}/apps/${endpoint}`, null, {
            method: 'POST',
            body: JSON.stringify({
              users: [contactpersoon],
              organization: null,
            }),
          });
        })
      );

      onSuccess?.();

      setResult({
        type: 'success',
        message: 'Contactpersonen succesvol uitgenodigd',
      });

      setTimeout(() => {
        setResult(null);
        onClose?.();
        modalRef?.current?.close();
      }, 3000);
    } catch (err) {
      console.error(err);
      setResult({
        type: 'error',
        message:
          err.message ||
          'Er is een fout opgetreden bij het uitnodigen van de contactpersonen',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      // Create deep copy of contactpersonen when modal opens
      setContactpersonenCopy(_.cloneDeep(contactpersonen));
      handleOpenModal();
    }
  }, [showModal]);

  const handleCloseModal = () => {
    onClose?.();
  };

  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleCloseModal);
  }, [modalRef.current]);

  const renderInviteModal = (
    <AcModal
      ref={modalRef}
      id='invite-contactpersonen-modal'
      title={`${
        contactpersonenCopy.length === 1 ? 'Contactpersoon' : 'Contactpersonen'
      } uitnodigen`}
      buttons={[
        {
          label: 'annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
        },
        {
          label: 'uitnodigen',
          icon: <VISUALS.PAPER_PLANE />,
          onClick: handleInviteUsers,
          disabled: true || isLoading || result?.type === 'success',
          loading: isLoading,
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        {result && (
          <Alert type={result.type === 'success' ? 'info' : result.type}>
            <AcFlex spacing='sm'>
              {result.type === 'error' ? <VISUALS.ERROR /> : <VISUALS.INFO_BLUE />}
              <Paragraph>{result.message}</Paragraph>
            </AcFlex>
          </Alert>
        )}

        <Paragraph style={{ fontSize: '1.1em', marginBottom: '1rem' }}>
          Weet je zeker dat je{' '}
          {contactpersonenCopy.length === 1
            ? 'de volgende gebruiker'
            : 'de volgende gebruikers'}{' '}
          wilt uitnodigen? <br />
          Hiermee{' '}
          {contactpersonenCopy.length === 1
            ? 'krijgt deze gebruiker'
            : 'krijgen deze gebruikers'}{' '}
          toegang tot de Softwarecatalogus.
        </Paragraph>
        <div>
          {contactpersonenCopy.map((contactpersoon) => (
            <Paragraph
              key={contactpersoon.id}
              style={{
                padding: '0.75rem',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                marginBottom: '0.5rem',
              }}
            >
              <strong>
                {contactpersoon.voornaam} {contactpersoon.achternaam}
              </strong>
              <span style={{ color: '#666', marginLeft: '0.5rem' }}>
                ({contactpersoon.email || 'geen email'})
              </span>
            </Paragraph>
          ))}
        </div>
      </AcFlex>
    </AcModal>
  );

  return renderInviteModal;
};

export default withStore(observer(AcContactpersonenUitnodigenModal));
