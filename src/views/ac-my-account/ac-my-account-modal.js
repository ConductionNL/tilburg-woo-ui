import React, { useEffect, useRef, useState, useCallback } from 'react';
import AcModal from '@components/ac-modal/ac-modal';
import AcFormField from '@molecules/ac-form-field/ac-form-field';
import AcButton from '@molecules/ac-button/ac-button';
import { VISUALS } from '@constants';
import {
  Heading,
  Paragraph,
  Alert,
} from '@utrecht/component-library-react/dist/css-module';
import AcColumn from '@atoms/ac-column/ac-column';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';

const AcMyAccountModal = ({
  showModal = false,
  onClose,
  onSuccess,
  formData: initialFormData,
  touched: initialTouched,
  validateEmail: parentValidateEmail,
}) => {
  const modalRef = useRef(null);
  const { updateUser } = useNextcloudRequests();

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    firstName: '',
    middleName: '',
    lastName: '',
  });
  const [touched, setTouched] = useState({
    displayName: false,
    email: false,
    firstName: false,
    middleName: false,
    lastName: false,
  });
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (showModal) {
      setFormData({
        ...formData,
        ...initialFormData,
      });
      setAlert(null);
      modalRef?.current?.showModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  useEffect(() => {
    const handleModalClose = () => {
      setAlert(null);
      onClose?.();
    };
    modalRef?.current?.addEventListener('close', handleModalClose);
    return () => modalRef?.current?.removeEventListener('close', handleModalClose);
  }, [onClose]);

  const validateEmail = useCallback(
    (email) =>
      parentValidateEmail
        ? parentValidateEmail(email)
        : email && email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
    [parentValidateEmail]
  );

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.displayName?.trim()) {
      errors.displayName = 'Weergavenaam is verplicht';
    }
    if (!formData.email?.trim()) {
      errors.email = 'E-mailadres is verplicht';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Ongeldig e-mailadres';
    }
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setAlert({
        type: 'error',
        message: 'Controleer de fouten in het formulier en probeer het opnieuw.',
      });
      return;
    }
    setSaving(true);
    setAlert(null);
    try {
      const updateData = {
        displayName: formData.displayName.trim(),
        email: formData.email.trim(),
        firstName: formData.firstName?.trim() || null,
        middleName: formData.middleName?.trim() || null,
        lastName: formData.lastName?.trim() || null,
      };
      await updateUser(updateData);
      setAlert({
        type: 'info',
        message: 'Uw gegevens zijn succesvol bijgewerkt.',
      });
      onSuccess?.();
      setTimeout(() => {
        modalRef?.current?.close();
      }, 3000);
    } catch (err) {
      console.error(err);
      setAlert({
        type: 'error',
        message:
          err?.message ||
          'Er is een fout opgetreden bij het opslaan van uw gegevens.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AcModal
      ref={modalRef}
      id='edit-account-modal'
      title='Persoonlijke gegevens bewerken'
      layoutClassName='wide-content'
      buttons={[
        {
          label: 'Opslaan',
          icon: <VISUALS.SAVE />,
          onClick: handleSubmit,
          disabled: saving,
        },
        {
          label: 'Annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
        },
      ]}
      disableDefaultButton
    >
      <AcColumn gap='sm'>
        {alert && (
          <Alert type={alert.type}>
            <Paragraph>{alert.message}</Paragraph>
          </Alert>
        )}
        <div className='ac-register-form-section'>
          <div className='ac-register-form-grid'>
            <div>
              <AcFormField
                label='Weergavenaam'
                required={true}
                placeholder='Uw weergavenaam'
                value={formData.displayName}
                type='text'
                onBlur={(value) => handleFieldChange('displayName', value)}
                hasError={touched.displayName && !formData.displayName?.trim()}
                id='display-name-field'
                disabled={saving}
              />
              <span className='ac-register-form-field-error'>
                {touched.displayName &&
                  !formData.displayName?.trim() &&
                  'Dit veld is verplicht'}
              </span>
            </div>

            <div>
              <AcFormField
                label='E-mailadres'
                required={true}
                placeholder='uw.email@example.com'
                value={formData.email}
                type='email'
                onBlur={(value) => handleFieldChange('email', value)}
                hasError={
                  (touched.email && !formData.email?.trim()) ||
                  (formData.email && !validateEmail(formData.email))
                }
                id='email-field'
                disabled={saving}
              />
              <span className='ac-register-form-field-error'>
                {touched.email && !formData.email?.trim()
                  ? 'Dit veld is verplicht'
                  : formData.email &&
                    !validateEmail(formData.email) &&
                    'Ongeldig e-mailadres'}
              </span>
            </div>

            <div>
              <AcFormField
                label='Voornaam'
                placeholder='Uw voornaam'
                value={formData.firstName}
                type='text'
                onBlur={(value) => handleFieldChange('firstName', value)}
                id='first-name-field'
                disabled={saving}
              />
            </div>

            <div>
              <AcFormField
                label='Tussenvoegsels'
                placeholder='Uw tussenvoegsels'
                value={formData.middleName}
                type='text'
                onBlur={(value) => handleFieldChange('middleName', value)}
                id='middle-name-field'
                disabled={saving}
              />
            </div>

            <div>
              <AcFormField
                label='Achternaam'
                placeholder='Uw achternaam'
                value={formData.lastName}
                type='text'
                onBlur={(value) => handleFieldChange('lastName', value)}
                id='last-name-field'
                disabled={saving}
              />
            </div>
          </div>
        </div>
      </AcColumn>
    </AcModal>
  );
};

export default AcMyAccountModal;
