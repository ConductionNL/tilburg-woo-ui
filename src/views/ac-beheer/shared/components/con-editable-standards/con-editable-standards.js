import React, { useEffect, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { VISUALS } from '@constants';
import { AcButton } from '@molecules';
import { AcFlex } from '@src/atoms';
import { ConStandardsTable } from '@components';

/**
 * ConEditableStandards - Standards editing component that follows the same pattern as ConEditableDescription
 *
 * This component handles standards editing with the exact same flow as ConEditableDescription:
 * 1. Component manages its own editing state internally
 * 2. PATCH request is sent internally
 * 3. onSuccess is called only after 200 response
 * 4. No external state management needed
 */
const ConEditableStandards = ({
  store: { object: objectStore },
  registerSlug,
  schemaSlug,
  objectId,
  referentieComponenten,
  complianceStandards,
  referentieComponentenWithStandards,
  onStandardsCountChange,
  onReferentieComponentenChange,
  onSuccess,
  onCancel,
  canEdit = true,
  isEditingCustomTrigger = undefined,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localCompliancy, setLocalCompliancy] = useState([]);
  const [localSaving, setLocalSaving] = useState(false);

  // Initialize local compliancy when component mounts or complianceStandards changes
  useEffect(() => {
    setLocalCompliancy(complianceStandards || []);
  }, [complianceStandards]);

  // Handle custom trigger (same pattern as ConEditableDescription)
  useEffect(() => {
    if (isEditingCustomTrigger) {
      setIsEditing(true);
      setLocalCompliancy(complianceStandards || []);
    } else if (isEditingCustomTrigger === false) {
      setIsEditing(false);
      setLocalCompliancy(complianceStandards || []);
    }
  }, [isEditingCustomTrigger, complianceStandards]);

  const handleSave = async () => {
    if (!objectId) return;

    setLocalSaving(true);
    try {
      // Send PATCH request (same as ConEditableDescription pattern)
      await objectStore.patchObject(registerSlug, schemaSlug, objectId, {
        compliancy: localCompliancy,
      });

      // Exit editing mode (same as ConEditableDescription)
      setIsEditing(false);

      // Call onSuccess callback (same as ConEditableDescription)
      if (onSuccess) {
        onSuccess(localCompliancy);
      }
    } catch (error) {
      console.error('Error saving compliancy:', error);
    } finally {
      setLocalSaving(false);
    }
  };

  const handleCancel = () => {
    if (isEditingCustomTrigger) {
      if (onCancel) onCancel();
    }
    setIsEditing(false);
    setLocalCompliancy(complianceStandards || []);
  };

  return (
    <div>
      <ConStandardsTable
        referentieComponenten={referentieComponenten}
        complianceStandards={isEditing ? localCompliancy : complianceStandards}
        referentieComponentenWithStandards={referentieComponentenWithStandards}
        disabled={localSaving}
        enableScrolling={false}
        onStandardsCountChange={onStandardsCountChange}
        onReferentieComponentenChange={onReferentieComponentenChange}
        isEditing={isEditing}
        onComplianceChange={(newCompliancy) => {
          setLocalCompliancy(newCompliancy);
        }}
      />

      {/* Editing buttons - same pattern as ConEditableDescription */}
      {isEditing && canEdit && (
        <AcFlex
          spacing='sm'
          justifyContent='end'
          style={{ marginBlockStart: 'var(--tilburg-space-block-mouse)' }}
        >
          <AcButton
            style='button'
            buttonType='secondary'
            icon={<VISUALS.CLOSE />}
            onClick={handleCancel}
            disabled={localSaving}
          >
            Annuleren
          </AcButton>
          <AcButton
            style='button'
            onClick={handleSave}
            icon={<VISUALS.SAVE />}
            disabled={localSaving}
            loading={localSaving}
          >
            {localSaving ? 'Opslaan...' : 'Opslaan'}
          </AcButton>
        </AcFlex>
      )}
    </div>
  );
};

export default withStore(observer(ConEditableStandards));
