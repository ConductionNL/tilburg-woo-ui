import React, { memo } from 'react';
import {
  Paragraph,
  UnorderedList,
  UnorderedListItem,
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
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='dienst-controleren-section-title'
      >
        <h2 id='dienst-controleren-section-title' className='sr-only'>
          Controleren
        </h2>

        <Paragraph>
          <strong>Controleer uw invoer voordat u opslaat</strong>
        </Paragraph>

        <UnorderedList>
          <UnorderedListItem>
            <strong>Naam:</strong> {dienst.naam || '-'}
          </UnorderedListItem>
          <UnorderedListItem>
            <strong>Website:</strong> {dienst.website || '-'}
          </UnorderedListItem>
          <UnorderedListItem>
            <strong>Type:</strong> {dienst.type || '-'}
          </UnorderedListItem>
          <UnorderedListItem>
            <strong>Aanbieder:</strong>{' '}
            {dienst.aanbieder?.naam ||
              dienst.aanbieder?.name ||
              dienst.aanbieder?.title ||
              '-'}
          </UnorderedListItem>
          <UnorderedListItem>
            <strong>Producten:</strong> {productLabels.join(', ') || '-'}
          </UnorderedListItem>
          <UnorderedListItem>
            <strong>Applicaties:</strong> {moduleLabels.join(', ') || '-'}
          </UnorderedListItem>
          <UnorderedListItem>
            <strong>Koppelingen:</strong> {koppelingLabels.join(', ') || '-'}
          </UnorderedListItem>
        </UnorderedList>
      </div>
    );
  }
);

ConFormControlerenStage.displayName = 'ConFormControlerenStage';

export default ConFormControlerenStage;
