import React, { memo } from 'react';
import { ConUuidResolver } from '@components';
import {
  UnorderedList,
  UnorderedListItem,
  Separator,
} from '@utrecht/component-library-react/dist/css-module';

const ConFormControlerenStage = memo(
  ({
    dienst,
    selectedProductIds,
    productOptions,
    selectedModuleIds,
    moduleOptionsByProduct,
    selectedKoppelingIds,
    koppelingOptions,
  }) => {
    const productLabels = (selectedProductIds || [])
      .map((id) => (productOptions || []).find((o) => o.value === id)?.label)
      .filter(Boolean);

    const moduleLabels = (selectedModuleIds || [])
      .map((id) => {
        // moduleOptionsByProduct is a lookup per product, flatten for label lookup
        const all = Object.values(moduleOptionsByProduct || {}).flat();
        return all.find((o) => o.value === id)?.label;
      })
      .filter(Boolean);

    const koppelingLabels = (selectedKoppelingIds || [])
      .map((id) => (koppelingOptions || []).find((o) => o.value === id)?.label || id)
      .filter(Boolean);

    return (
      <div>
        <div className='con-form-wizard-review-heading-container'>
          <h3 className='con-form-wizard-review-heading-header'>
            Dienst informatie
          </h3>
          <div className='ac-register-review__section'>
            <div className='ac-register-review__header'>
              <h4 className='utrecht-heading-4'>
                {dienst.naam ? (
                  <ConUuidResolver>{dienst.naam}</ConUuidResolver>
                ) : (
                  '-'
                )}
              </h4>
            </div>
            <Separator className='con-form-wizard-review-header__separator' />

            <div className='ac-register-review__field'>
              <strong>Website:</strong>{' '}
              <span>
                {dienst.website ? (
                  <ConUuidResolver>{dienst.website}</ConUuidResolver>
                ) : (
                  '-'
                )}
              </span>
            </div>

            <div className='ac-register-review__field'>
              <strong>Type:</strong>{' '}
              <span>
                {dienst.type ? (
                  <ConUuidResolver>{dienst.type}</ConUuidResolver>
                ) : (
                  '-'
                )}
              </span>
            </div>
          </div>
        </div>

        <h3 className='con-form-wizard-review-heading-header'>Producten</h3>
        <div className='ac-register-review'>
          <div className='ac-register-review__section'>
            <div className='ac-register-review__field'>
              <UnorderedList>
                {(productLabels.length ? productLabels : ['-']).map((label, i) => (
                  <UnorderedListItem key={`prod-${i}`}>
                    <ConUuidResolver>{label}</ConUuidResolver>
                  </UnorderedListItem>
                ))}
              </UnorderedList>
            </div>
          </div>
        </div>

        <h3 className='con-form-wizard-review-heading-header'>Applicaties</h3>
        <div className='ac-register-review'>
          <div className='ac-register-review__section'>
            <div className='ac-register-review__field'>
              <UnorderedList>
                {(moduleLabels.length ? moduleLabels : ['-']).map((label, i) => (
                  <UnorderedListItem key={`mod-${i}`}>
                    <ConUuidResolver>{label}</ConUuidResolver>
                  </UnorderedListItem>
                ))}
              </UnorderedList>
            </div>
          </div>
        </div>

        <h3 className='con-form-wizard-review-heading-header'>Koppelingen</h3>
        <div className='ac-register-review'>
          <div className='ac-register-review__section'>
            <div className='ac-register-review__field'>
              <UnorderedList>
                {(koppelingLabels.length ? koppelingLabels : ['-']).map(
                  (label, i) => (
                    <UnorderedListItem key={`kp-${i}`}>
                      <ConUuidResolver>{label}</ConUuidResolver>
                    </UnorderedListItem>
                  )
                )}
              </UnorderedList>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ConFormControlerenStage.displayName = 'ConFormControlerenStage';

export default ConFormControlerenStage;
