// eslint-disable-next-line import/no-unresolved
import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';

/**
 * Modal to activate or deactivate an organization by changing its beoordeling
 * @param {object} organization - The organization to activate/deactivate
 * @param {boolean} activate - Whether to activate (true) or deactivate (false)
 * @param {boolean} showModal - boolean to check if the modal is shown
 * @param {function} onClose - function to call when the modal is closed
 * @returns {React.JSX.Element} - modal to activate/deactivate an organization
 */
const AcAcceptOrganizationModal = ({
  organization,
  activate = true,
  showModal = false,
  onClose,
  onSuccess,
  store: { object },
}) => {
  const modalRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleModalOpen = () => modalRef?.current?.showModal();

  const [error, setError] = useState(null);
  const handleActivateDeactivate = async () => {
    setLoading(true);
    setError(null);
    try {
      await object?.patchObject('voorzieningen', 'organisatie', organization.id, {
        beoordeling: activate ? 'Actief' : 'Deactief',
      });
      onSuccess?.();
      modalRef?.current?.close();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      const statusError = err?.response?.data?.error;
      setError(
        statusError ||
          err?.message ||
          `Er is een fout opgetreden bij het ${
            activate ? 'activeren' : 'deactiveren'
          }`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      handleModalOpen();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleModalClose = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleModalClose);
  }, [modalRef.current]);

  const errorStyle = {
    // the goal is to convert a value like #e53e3e to something like #fff5f5
    backgroundColor:
      'color-mix(in srgb, var(--utrecht-form-field-error-message-color, #e53e3e) 5%, #ffffff)',
    border: '1px solid var(--utrecht-form-field-error-message-color, #e53e3e)',
    borderRadius: '4px',
    color: 'var(--utrecht-form-field-error-message-color, #e53e3e)',
    fontSize: 'var(--utrecht-form-field-error-message-font-size, 1rem)',
    fontWeight: 'var(--utrecht-form-field-error-message-font-weight, 400)',
    padding: '1rem',
    margin: '0 0 1rem 0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: 'var(--utrecht-form-field-error-message-font-family)',
  };

  const renderModal = (
    <AcModal
      ref={modalRef}
      id={`${activate ? 'activate' : 'deactivate'}-organization-modal`}
      title={`Organisatie ${activate ? 'activeren' : 'deactiveren'}`}
      buttons={[
        {
          label: 'Annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
          disabled: loading,
        },
        {
          label: activate ? 'Activeren' : 'Deactiveren',
          icon: <VISUALS.CHECK />,
          onClick: handleActivateDeactivate,
          loading,
          disabled: loading,
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        {error && <div style={errorStyle}>{error}</div>}
        Weet je zeker dat je de volgende organisatie wilt{' '}
        {activate ? 'activeren' : 'deactiveren'}?
        <Paragraph>{organization?.naam ?? organization?.id}</Paragraph>
      </AcFlex>
    </AcModal>
  );

  return renderModal;
};

export default withStore(observer(AcAcceptOrganizationModal));
