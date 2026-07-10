// Portaliq create-action block — reuses the softwarecatalogus ConDynamicSchemaForm
// (the real schema-driven form renderer) driven by a contribution `action` of
// type "create". The form is scoped to the action's declared `fields`; submit
// goes through the object store's createObject, which the portal-mode adapter
// posts to /portal/api/collections/{register}/{schema} and then refreshes the
// collection the new row belongs to. No bespoke form code — same engine as beheer.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';

import { ConDynamicSchemaForm } from '@components';
import { useStore } from '@stores';

function PortalCreateForm({ action, user, onCreated }) {
  const store = useStore();
  const object = store.object;

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const schemaType = useMemo(
    () => (action?.schema ? object.getSchemaType(action.schema, 'form') : null),
    [object, action]
  );

  // Fetch the scoped schema (via /portal/api/schema/{slug}) when the form opens.
  useEffect(() => {
    if (open && action?.schema) {
      object.fetchSchema(action.schema, {}, 'form').catch(() => {});
    }
  }, [open, object, action]);

  const fullSchema = schemaType ? object.getSchema(schemaType) : null;

  // Restrict the form to the fields the action declares as writable.
  const formSchema = useMemo(() => {
    if (!fullSchema?.properties) { return null; }
    const allow = Array.isArray(action?.fields) ? action.fields : null;
    if (!allow) { return fullSchema; }
    const properties = {};
    allow.forEach((f) => {
      if (fullSchema.properties[f]) { properties[f] = fullSchema.properties[f]; }
    });
    return { ...fullSchema, properties };
  }, [fullSchema, action]);

  const onFieldChange = useCallback((field, value) => {
    setFormData((d) => ({ ...d, [field]: value }));
  }, []);

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      await object.createObject(action.register, action.schema, formData);
      setOpen(false);
      setFormData({});
      if (onCreated) { onCreated(); }
    } catch (e) {
      setError('Aanmaken mislukt. Probeer het opnieuw.');
    } finally {
      setSubmitting(false);
    }
  }, [object, action, formData, onCreated]);

  const label = action?.label || 'Toevoegen';

  return (
    <div className='portaliq-portal-action'>
      <button type='button' className='ac-button ac-button--primary' onClick={() => setOpen(true)}>
        {label}
      </button>

      {open && (
        <div className='portaliq-portal-form' role='dialog' aria-label={label}>
          <h3 className='portaliq-portal-form-title'>{label}</h3>
          {formSchema ? (
            <ConDynamicSchemaForm
              schema={formSchema}
              formData={formData}
              onFieldChange={onFieldChange}
              fieldConfigs={action?.fieldConfigs || {}}
              optionsProviders={action?.optionsProviders || {}}
              user={user}
            />
          ) : (
            <p>Formulier laden…</p>
          )}
          {error && <p className='portaliq-portal-form-error'>{error}</p>}
          <div className='portaliq-portal-form-actions'>
            <button type='button' className='ac-button ac-button--secondary' onClick={() => setOpen(false)} disabled={submitting}>
              Annuleren
            </button>
            <button type='button' className='ac-button ac-button--primary' onClick={submit} disabled={submitting || !formSchema}>
              {submitting ? 'Bezig…' : 'Opslaan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default observer(PortalCreateForm);
