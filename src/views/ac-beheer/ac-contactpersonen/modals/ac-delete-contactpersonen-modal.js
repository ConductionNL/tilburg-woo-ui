import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { AcFlex } from '@atoms';
import { Alert, Paragraph } from '@utrecht/component-library-react/dist/css-module';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { VISUALS } from '@constants';
import _ from 'lodash';

/**
 * modal to delete 1 or multiple contactpersonen
 * @param {object[]} contactpersonen - array of contactpersonen
 * @param {boolean} showModal - boolean to check if the modal is shown
 * @param {function} onClose - function to call when the modal is closed
 * @returns {React.JSX.Element} - modal to delete 1 or multiple contactpersonen
 */
const AcDeleteContactpersonenModal = ({
  contactpersonen,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);

  /** @type {[
    { type: 'error' | 'info' | 'success', message: string } | null,
    (state: { type: 'error' | 'info' | 'success', message: string } | null) => void
  ]} */
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [contactpersonenCopy, setContactpersonenCopy] = useState([]);

  const nextcloud = useNextcloudRequests();

  const handleDeleteContactpersoonOpenModal = () => modalRef?.current?.showModal();

  const endpoint = 'openregister/api/objects/voorzieningen/contactpersoon';

  const handleDeleteContactpersoon = async () => {
    try {
      const deletePromises = contactpersonenCopy.map((contactpersoon) =>
        nextcloud.request(`${endpoint}/${contactpersoon.id}`, {
          method: 'DELETE',
        })
      );

      const responses = await Promise.all(deletePromises);

      onSuccess?.();
      setResult({
        type: 'success',
        message: 'Contactpersonen succesvol verwijderd',
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
          'Er is een fout opgetreden bij het verwijderen van de contactpersonen',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      // Create deep copy of contactpersonen when modal opens
      setContactpersonenCopy(_.cloneDeep(contactpersonen));
      handleDeleteContactpersoonOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleDeleteContactpersoonCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener(
      'close',
      handleDeleteContactpersoonCloseModal
    );
  }, [modalRef.current]);

  const renderDeleteContactpersoonModal = (
    <AcModal
      ref={modalRef}
      id='delete-contactpersoon-modal'
      title={`${
        contactpersonenCopy.length === 1 ? 'Contactpersoon' : 'Contactpersonen'
      } verwijderen`}
      buttons={[
        {
          label: 'annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
        },
        {
          label: 'verwijderen',
          icon: <VISUALS.TRASHCAN />,
          onClick: handleDeleteContactpersoon,
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        {result && (
          <Alert type={result.type === 'success' ? 'info' : result.type}>
            <AcFlex spacing='sm'>
              {result.type === 'error' ? <VISUALS.CIRCLE_EXCLAMATION /> : <VISUALS.INFO_BLUE />}
              <Paragraph>{result.message}</Paragraph>
            </AcFlex>
          </Alert>
        )}
        Weet je zeker dat je deze{' '}
        {contactpersonenCopy.length === 1 ? 'Contactpersoon' : 'Contactpersonen'}{' '}
        wilt verwijderen?
        {contactpersonenCopy.map((contactpersoon) => (
          <Paragraph key={contactpersoon.id}>
            {contactpersoon.voornaam} {contactpersoon.achternaam} (
            {contactpersoon.email})
          </Paragraph>
        ))}
      </AcFlex>
    </AcModal>
  );

  return renderDeleteContactpersoonModal;
};

export default withStore(observer(AcDeleteContactpersonenModal));
