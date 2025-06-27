import React, { useEffect, useRef, useState, useCallback } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { AcFormField } from '@src/molecules';
import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { BASE_URL } from '../../ac-beheer';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';

/**
 * Modal for adding a contact person to an organization
 * @param {Object} props - Component props
 * @param {string} props.organizationId - Organization ID
 * @param {Array} props.contactPersons - Array of all contact persons with UUIDs
 * @param {string} props.selectedContactPersonUuid - UUID of the contact person to edit (optional)
 * @param {boolean} props.showModal - Controls modal visibility
 * @param {function} props.onClose - Called when modal closes
 * @param {function} props.onSuccess - Called on successful submission
 * @param {boolean} props.isEdit - Whether this is an edit operation
 * @returns {JSX.Element} Contact person modal
 */
const AcContactPersonForm = ({
  organizationId,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});
  const [contactPerson, setContactPerson] = useState({
    voornaam: '',
    tussenvoegsel: '',
    achternaam: '',
    telefoonnummer: '',
    email: '',
    functie: '',
  });

  const { makeRequest } = useNextcloudRequests();

  useEffect(() => {
    if (showModal) {
      modalRef?.current?.showModal();
    }
  }, [showModal]);

  const validateEmail = useCallback((email) => {
    return email && email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
  }, []);

  const validatePhone = useCallback((phone) => {
    if (!phone) return false;
    return isValidPhoneNumber(phone, 'NL');
  }, []);

  const handleOnClose = useCallback(() => {
    onClose?.();

    setContactPerson({
      voornaam: '',
      tussenvoegsel: '',
      achternaam: '',
      telefoonnummer: '',
      email: '',
      functie: '',
    });

    setTouched({});
    setError(null);
  }, [onClose]);

  useEffect(() => {
    const modal = modalRef.current;
    if (modal) {
      modal.addEventListener('close', handleOnClose);
      return () => modal.removeEventListener('close', handleOnClose);
    }
  }, [modalRef.current, handleOnClose]);

  const handleFieldChange = (field, value) => {
    setContactPerson((prev) => ({
      ...prev,
      [field]: value,
    }));
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const isFormValid = () => {
    return (
      contactPerson.voornaam &&
      contactPerson.achternaam &&
      contactPerson.telefoonnummer &&
      validatePhone(contactPerson.telefoonnummer) &&
      contactPerson.email &&
      validateEmail(contactPerson.email)
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Update the organization with PATCH request
      const endpoint = `openregister/api/objects/voorzieningen/gebruiker`;
      const updateResponse = await makeRequest(
        `${BASE_URL}/apps/${endpoint}`,
        null,
        {
          method: 'POST',
          body: JSON.stringify({
            organisatie: organizationId,
            ...contactPerson,
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!updateResponse.ok) {
        throw new Error('Failed to add contact person');
      }

      // Call onSuccess first, then close modal
      onSuccess?.();

      // Close the modal
      if (modalRef?.current) {
        modalRef.current.close();
      }

      // Also call onClose to ensure parent component state is updated
      onClose?.();
    } catch (err) {
      console.error('Error adding contact person:', err);
      setError(
        err.message ||
          `Er is een fout opgetreden bij het ${'toevoegen'} van de contactpersoon.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AcModal
      ref={modalRef}
      id={'add-contact-person-modal'}
      title={'Contact persoon toevoegen'}
      layoutClassName='wide-content'
      buttons={[
        {
          label: 'Annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
        },
        {
          label: 'Opslaan',
          icon: <VISUALS.SAVE />,
          onClick: handleSubmit,
          disabled: isSubmitting || !isFormValid(),
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='md'>
        {error && <div className='error-message'>{error}</div>}

        <div className='ac-register-form-grid'>
          <div>
            <AcFormField
              label='Voornaam'
              required
              placeholder='John'
              value={contactPerson.voornaam}
              type='text'
              onBlur={(e) => handleFieldChange('voornaam', e)}
              hasError={touched.voornaam && !contactPerson.voornaam}
              id='firstname-field'
              disabled={isSubmitting}
            />
            {touched.voornaam && !contactPerson.voornaam && (
              <span className='ac-register-form-field-error'>
                Dit veld is verplicht
              </span>
            )}
          </div>

          <div>
            <AcFormField
              label='Tussenvoegsel'
              placeholder='van der'
              value={contactPerson.tussenvoegsel}
              type='text'
              onBlur={(e) => handleFieldChange('tussenvoegsel', e)}
              id='middlename-field'
              disabled={isSubmitting}
            />
          </div>

          <div>
            <AcFormField
              label='Achternaam'
              required
              placeholder='Doe'
              value={contactPerson.achternaam}
              type='text'
              onBlur={(e) => handleFieldChange('achternaam', e)}
              hasError={touched.achternaam && !contactPerson.achternaam}
              id='lastname-field'
              disabled={isSubmitting}
            />
            {touched.achternaam && !contactPerson.achternaam && (
              <span className='ac-register-form-field-error'>
                Dit veld is verplicht
              </span>
            )}
          </div>

          <div>
            <AcFormField
              label='telefoonnummer'
              required
              placeholder='06 12345678'
              value={contactPerson.telefoonnummer}
              type='tel'
              onBlur={(e) => handleFieldChange('telefoonnummer', e)}
              hasError={
                (touched.telefoonnummer && !contactPerson.telefoonnummer) ||
                (contactPerson.telefoonnummer &&
                  !validatePhone(contactPerson.telefoonnummer))
              }
              id='phone-field'
              disabled={isSubmitting}
            />
            <span className='ac-register-form-field-error'>
              {touched.telefoonnummer && !contactPerson.telefoonnummer
                ? 'Dit veld is verplicht'
                : contactPerson.telefoonnummer &&
                  !validatePhone(contactPerson.telefoonnummer) &&
                  'Ongeldig telefoonnummer. Gebruik een Nederlands nummer (bijv. 06 1234 5678 of +31 6 1234 5678)'}
            </span>
          </div>

          <div>
            <AcFormField
              label='E-mailadres'
              required
              placeholder='john.doe@example.com'
              value={contactPerson.email}
              type='email'
              onBlur={(e) => handleFieldChange('email', e)}
              hasError={
                (touched.email && !contactPerson.email) ||
                (contactPerson.email && !validateEmail(contactPerson.email))
              }
              id='email-field'
              disabled={isSubmitting}
            />
            <span className='ac-register-form-field-error'>
              {touched.email && !contactPerson.email
                ? 'Dit veld is verplicht'
                : contactPerson.email &&
                  !validateEmail(contactPerson.email) &&
                  'Ongeldig e-mailadres'}
            </span>
          </div>

          <div>
            <AcFormField
              label='Functie'
              placeholder='Sales Manager'
              value={contactPerson.functie}
              type='text'
              onBlur={(e) => handleFieldChange('functie', e)}
              id='function-field'
              disabled={isSubmitting}
            />
          </div>
        </div>
      </AcFlex>
    </AcModal>
  );
};

export default withStore(observer(AcContactPersonForm));
