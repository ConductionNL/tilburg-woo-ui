import React, { useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import ReactSelect from 'react-select';
import clsx from 'clsx';

/**
 * Shared Organization Selector Component
 * - Shows organization dropdown when user has multiple organizations
 * - Handles organization switching using UserStore's updateUser method
 * - Reusable across different pages (dashboard, my-organization, etc.)
 */
const ConOrganizationSelector = ({
  store,
  className = '',
  onSwitchSuccess = () => {},
  onSwitchError = () => {},
  placeholder = 'Selecteer organisatie',
}) => {
  const [switchingOrg, setSwitchingOrg] = useState(false);
  const { user } = store;

  // Get user organizations data
  const organisations = user?.user?.organisations;
  const activeOrganisation = organisations?.active;

  // Handle organization switching using existing updateUser function
  const handleOrganisationSwitch = useCallback(
    async (selectedOption) => {
      if (!selectedOption || selectedOption.value === activeOrganisation?.uuid) {
        return;
      }

      try {
        setSwitchingOrg(true);

        // Use UserStore's updateUser method
        const response = await user.updateUser({
          activeOrganisation: selectedOption.value,
        });

        // Call success callback with updated user data
        onSwitchSuccess(response.data);
      } catch (err) {
        console.error('Error switching organization:', err);

        // Call error callback
        onSwitchError(
          new Error('Er is een fout opgetreden bij het wisselen van organisatie.')
        );
      } finally {
        setSwitchingOrg(false);
      }
    },
    [activeOrganisation?.uuid, user, onSwitchSuccess, onSwitchError]
  );

  // Don't render if user doesn't have multiple organizations
  if (!organisations?.results?.length || organisations.results.length <= 1) {
    return null;
  }

  const inputId = 'con-organization-selector-input';

  return (
    <>
      <label className='sr-only' htmlFor={inputId}>
        Selecteer organisatie
      </label>
      <ReactSelect
        inputId={inputId}
        placeholder={placeholder}
        value={
          activeOrganisation
            ? {
                value: activeOrganisation.uuid,
                label:
                  activeOrganisation.name +
                  (activeOrganisation.isDefault ? ' (Standaard)' : ''),
              }
            : null
        }
        className={clsx(
          'ac-beheer-select con-organization-selector',
          switchingOrg && 'ac-beheer-select--disabled',
          className
        )}
        onChange={handleOrganisationSwitch}
        options={organisations.results.map((org) => ({
          value: org.uuid,
          label: org.name + (org.isDefault ? ' (Standaard)' : ''),
        }))}
        isLoading={switchingOrg}
        isDisabled={switchingOrg}
        isClearable={false}
        styles={{
          container: (provided) => ({
            ...provided,
            minWidth: '200px',
          }),
        }}
      />
    </>
  );
};

export default observer(ConOrganizationSelector);
