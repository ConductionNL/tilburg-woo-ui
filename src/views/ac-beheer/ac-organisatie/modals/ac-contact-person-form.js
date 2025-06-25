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
 * Modal for adding or editing a contact person to an organization
 * @param {Object} props - Component props
 * @param {Object} props.organization - Organization data
 * @param {Array} props.contactPersons - Array of all contact persons with UUIDs
 * @param {string} props.selectedContactPersonUuid - UUID of the contact person to edit (optional)
 * @param {boolean} props.showModal - Controls modal visibility
 * @param {function} props.onClose - Called when modal closes
 * @param {function} props.onSuccess - Called on successful submission
 * @param {boolean} props.isEdit - Whether this is an edit operation
 * @returns {JSX.Element} Contact person modal
 */
const AcContactPersonForm = ({
  organization,
  contactPersons = [],
  selectedContactPersonUuid,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
}) => {
  const modalRef = useRef(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});
  const [contactPerson, setContactPerson] = useState({
    voornaam: '',
    tussenvoegsel: '',
    achternaam: '',
    telefoon: '',
    email: '',
    functie: '',
  });

  const { makeRequest } = useNextcloudRequests();

  const validateEmail = useCallback((email) => {
    return email && email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
  }, []);

  const validatePhone = useCallback((phone) => {
    if (!phone) return false;
    return isValidPhoneNumber(phone, 'NL');
  }, []);

  // Load contact person data into the form when editing
  useEffect(() => {
    if (showModal) {
      modalRef?.current?.showModal();

      if (isEdit && selectedContactPersonUuid) {
        // Find the contact person to edit by UUID
        const contactToEdit = contactPersons.find(
          (contact) => contact.uuid === selectedContactPersonUuid
        );

        if (contactToEdit) {
          // Load existing contact person data for editing
          setContactPerson({
            voornaam: contactToEdit.voornaam || '',
            tussenvoegsel: contactToEdit.tussenvoegsel || '',
            achternaam: contactToEdit.achternaam || '',
            telefoon: contactToEdit.telefoon || '',
            email: contactToEdit.email || '',
            functie: contactToEdit.functie || '',
          });
        }
      } else {
        // Reset form for adding new contact person
        setContactPerson({
          voornaam: '',
          tussenvoegsel: '',
          achternaam: '',
          telefoon: '',
          email: '',
          functie: '',
        });
      }

      setTouched({});
      setError(null);
    }
  }, [showModal, isEdit, selectedContactPersonUuid, contactPersons]);

  useEffect(() => {
    const modal = modalRef.current;
    if (modal) {
      modal.addEventListener('close', onClose);
      return () => modal.removeEventListener('close', onClose);
    }
  }, [modalRef.current, onClose]);

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
      contactPerson.telefoon &&
      validatePhone(contactPerson.telefoon) &&
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

      let updatedContactPersons;

      if (isEdit && selectedContactPersonUuid) {
        // Update existing contact person by UUID
        updatedContactPersons = contactPersons.map((contact) =>
          contact.uuid === selectedContactPersonUuid
            ? {
                ...contact,
                voornaam: contactPerson.voornaam,
                tussenvoegsel: contactPerson.tussenvoegsel,
                achternaam: contactPerson.achternaam,
                telefoon: contactPerson.telefoon,
                email: contactPerson.email,
                functie: contactPerson.functie,
              }
            : contact
        );
      } else {
        // Add new contact person with UUID
        const newContactPerson = {
          ...contactPerson,
          uuid: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        updatedContactPersons = [...contactPersons, newContactPerson];
      }

      // Remove UUIDs from the array before sending to API
      const contactPersonsForApi = updatedContactPersons.map(
        ({ uuid, ...contact }) => contact
      );

      // Update the organization with PATCH request
      const endpoint = `openregister/api/objects/voorzieningen/organisatie/${organization.id}`;
      const updateResponse = await makeRequest(
        `${BASE_URL}/apps/${endpoint}`,
        null,
        {
          method: 'PATCH',
          body: JSON.stringify({
            contactpersonen: contactPersonsForApi,
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!updateResponse.ok) {
        throw new Error(
          isEdit ? 'Failed to update contact person' : 'Failed to add contact person'
        );
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
      console.error(
        isEdit ? 'Error updating contact person:' : 'Error adding contact person:',
        err
      );
      setError(
        err.message ||
          `Er is een fout opgetreden bij het ${
            isEdit ? 'bewerken' : 'toevoegen'
          } van de contactpersoon.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AcModal
      ref={modalRef}
      id={isEdit ? 'edit-contact-person-modal' : 'add-contact-person-modal'}
      title={isEdit ? 'Contact persoon bewerken' : 'Contact persoon toevoegen'}
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
              label='Telefoonnummer'
              required
              placeholder='06 12345678'
              value={contactPerson.telefoon}
              type='tel'
              onBlur={(e) => handleFieldChange('telefoon', e)}
              hasError={
                (touched.telefoon && !contactPerson.telefoon) ||
                (contactPerson.telefoon && !validatePhone(contactPerson.telefoon))
              }
              id='phone-field'
              disabled={isSubmitting}
            />
            <span className='ac-register-form-field-error'>
              {touched.telefoon && !contactPerson.telefoon
                ? 'Dit veld is verplicht'
                : contactPerson.telefoon &&
                  !validatePhone(contactPerson.telefoon) &&
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
