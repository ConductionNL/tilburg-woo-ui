// eslint-disable-next-line import/no-unresolved
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { VISUALS } from '@constants';
import ReactSelect from 'react-select';
import { AcFlex } from '@src/atoms';
import { Alert } from '@utrecht/component-library-react';

const AcGebruikKoppelenModal = ({
  store: { object },
  gebruik,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);
  const [gebruiken, setGebruiken] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVan, setSelectedVan] = useState(gebruik || null);
  const [selectedNaar, setSelectedNaar] = useState(null);
  const [error, setError] = useState(null);

  const typeKey = object.getTypeFromParams(
    'voorzieningen',
    'voorzieninggebruik'
  );

  const handleOpenModal = () => modalRef?.current?.showModal();
  const handleCloseModal = () => modalRef?.current?.close();
  const onCloseModal = () => {
    setSelectedVan(gebruik || null);
    setSelectedNaar(null);
    setError(null);
    onClose?.();
  };

  const fetchGebruiken = async () => {
    setLoading(true);
    try {
      await object.fetchCollection('voorzieningen', 'voorzieninggebruik', {
        _limit: 500,
        _page: 1,
      });
      const col = object.getCollection(typeKey);
      setGebruiken(col.results || []);
    } catch (err) {
      setError(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (showModal) {
      fetchGebruiken();
      handleOpenModal();
    }
    if (gebruik) {
      setSelectedVan(gebruik);
    }
  }, [showModal]);

  useEffect(() => {
    modalRef?.current?.addEventListener('close', onCloseModal);
  }, [modalRef.current]);

  const handleSubmit = async () => {
    if (!selectedVan || !selectedNaar) return;
    setError(null);

    try {
      await object.linkGebruik(selectedVan.id, selectedNaar.id);
      onSuccess?.();
      handleCloseModal();
    } catch (err) {
      setError(err);
    }
  };

  const gebruikenOptions = useMemo(() => {
    return gebruiken.map((g) => ({
      value: g.id,
      label: g.id,
      ...g,
    }));
  }, [gebruiken]);

  const renderGebruikFormModal = (
    <AcModal
      ref={modalRef}
      id='edit-gebruik-modal'
      title='Gebruik koppelen'
      buttons={[
        {
          label: 'annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: handleCloseModal,
          buttonType: 'secondary',
        },
        {
          label: 'koppelen',
          icon: <VISUALS.SAVE />,
          onClick: handleSubmit,
          disabled: !selectedVan || !selectedNaar,
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        {error && (
          <Alert type='error'>
            Er is een fout opgetreden bij het koppelen van de gebruiken. Probeer het
            opnieuw.
          </Alert>
        )}
        <div>
          <label>Van gebruik</label>
          <ReactSelect
            value={
              selectedVan
                ? {
                    value: selectedVan.id,
                    label: selectedVan.id,
                    ...selectedVan,
                  }
                : null
            }
            options={gebruikenOptions}
            onChange={(option) => setSelectedVan(option)}
            isDisabled={!!gebruik}
            isLoading={loading}
          />
        </div>
        <div>
          <label>Naar gebruik</label>
          <ReactSelect
            value={selectedNaar}
            options={gebruikenOptions.filter((g) => g.value !== selectedVan?.id)}
            onChange={(option) => setSelectedNaar(option)}
            isLoading={loading}
          />
        </div>
      </AcFlex>
    </AcModal>
  );

  return renderGebruikFormModal;
};

export default withStore(observer(AcGebruikKoppelenModal));
