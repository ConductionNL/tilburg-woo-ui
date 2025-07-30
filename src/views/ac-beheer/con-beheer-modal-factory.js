import loadable from '@loadable/component';

/**
 * Modal Factory for Beheer Pages
 * This factory manages the loading and rendering of modal components
 */
const BeheerModalFactory = {
  /**
   * Modal component mappings for each beheer type
   */
  modalComponents: {
    applicaties: {
      add: loadable(() =>
        import('./ac-applicaties/modals/ac-applicaties-form-modal')
      ),
      edit: loadable(() =>
        import('./ac-applicaties/modals/ac-applicaties-form-modal')
      ),
      delete: loadable(() =>
        import('./ac-applicaties/modals/ac-delete-applicaties-modal')
      ),
      import: loadable(() => import('./import-modal/ac-beheer-import-modal')),
    },
    diensten: {
      add: loadable(() => import('./ac-dienst/modals/ac-dienst-form-modal')),
      edit: loadable(() => import('./ac-dienst/modals/ac-dienst-form-modal')),
      delete: loadable(() => import('./ac-dienst/modals/ac-delete-dienst-modal')),
      import: loadable(() => import('./import-modal/ac-beheer-import-modal')),
    },
    'voorzieningen-versie': {
      add: loadable(() =>
        import('./ac-voorzieningen-versie/modals/ac-voorziening-versie-form-modal')
      ),
      edit: loadable(() =>
        import('./ac-voorzieningen-versie/modals/ac-voorziening-versie-form-modal')
      ),
      delete: loadable(() =>
        import('./ac-voorzieningen-versie/modals/ac-delete-voorziening-versie-modal')
      ),
      import: loadable(() => import('./import-modal/ac-beheer-import-modal')),
    },
    organisaties: {
      add: loadable(() =>
        import('./ac-organisatie/modals/ac-organisatie-form-modal')
      ),
      edit: loadable(() =>
        import('./ac-organisatie/modals/ac-organisatie-form-modal')
      ),
      delete: loadable(() =>
        import('./ac-organisatie/modals/ac-delete-organisatie-modal')
      ),
      import: loadable(() => import('./import-modal/ac-beheer-import-modal')),
      activate: loadable(() =>
        import('./ac-organisatie/modals/ac-accept-organisation')
      ),
      deactivate: loadable(() =>
        import('./ac-organisatie/modals/ac-accept-organisation')
      ),
      publish: loadable(() =>
        import('./ac-organisatie/modals/ac-publish-depublish-organisation')
      ),
      depublish: loadable(() =>
        import('./ac-organisatie/modals/ac-publish-depublish-organisation')
      ),
      addDeelname: loadable(() =>
        import('./ac-organisatie/modals/ac-add-remove-deelname')
      ),
      removeDeelname: loadable(() =>
        import('./ac-organisatie/modals/ac-add-remove-deelname')
      ),
    },
    kwetsbaarheden: {
      add: loadable(() =>
        import('./ac-kwetsbaarheid/modals/ac-kwetsbaarheid-form-modal')
      ),
      edit: loadable(() =>
        import('./ac-kwetsbaarheid/modals/ac-kwetsbaarheid-form-modal')
      ),
      delete: loadable(() =>
        import('./ac-kwetsbaarheid/modals/ac-delete-kwetsbaarheid-modal')
      ),
      import: loadable(() => import('./import-modal/ac-beheer-import-modal')),
    },
    gebruiken: {
      add: loadable(() => import('./ac-gebruiken/modals/ac-gebruiken-form-modal')),
      edit: loadable(() => import('./ac-gebruiken/modals/ac-gebruiken-form-modal')),
      delete: loadable(() =>
        import('./ac-gebruiken/modals/ac-delete-gebruiken-modal')
      ),
      import: loadable(() => import('./import-modal/ac-beheer-import-modal')),
      koppelen: loadable(() => import('./ac-gebruiken/modals/ac-gebruik-koppelen')),
    },
    overeenkomsten: {
      add: loadable(() =>
        import('./ac-overeenkomsten/modals/ac-overeenkomst-form-modal')
      ),
      edit: loadable(() =>
        import('./ac-overeenkomsten/modals/ac-overeenkomst-form-modal')
      ),
      delete: loadable(() =>
        import('./ac-overeenkomsten/modals/ac-delete-overeenkomsten-modal')
      ),
      import: loadable(() => import('./import-modal/ac-beheer-import-modal')),
    },
    contactpersonen: {
      add: loadable(() =>
        import('./ac-contactpersonen/modals/ac-contactpersonen-form-modal')
      ),
      edit: loadable(() =>
        import('./ac-contactpersonen/modals/ac-contactpersonen-form-modal')
      ),
      delete: loadable(() =>
        import('./ac-contactpersonen/modals/ac-delete-contactpersonen-modal')
      ),
      import: loadable(() => import('./import-modal/ac-beheer-import-modal')),
      publish: loadable(() =>
        import('./ac-contactpersonen/modals/ac-publish-depublish-contactpersoon')
      ),
      depublish: loadable(() =>
        import('./ac-contactpersonen/modals/ac-publish-depublish-contactpersoon')
      ),
    },
  },

  /**
   * Get modal component for a specific type and modal action
   * @param {string} type - The beheer page type
   * @param {string} modalType - The modal action type
   * @returns {Component|null} The modal component or null if not found
   */
  getModalComponent: (type, modalType) => {
    return BeheerModalFactory.modalComponents[type]?.[modalType] || null;
  },

  /**
   * Get modal props for a specific type and modal action
   * @param {string} type - The beheer page type
   * @param {string} modalType - The modal action type
   * @param {Object} params - Parameters for the modal
   * @returns {Object} Modal props
   */
  getModalProps: (type, modalType, params) => {
    const {
      singleSelectedRow,
      selectedRows,
      openModal,
      setOpenModal,
      setSingleSelectedRow,
      tableRef,
      fetchData,
      config,
    } = params;

    const baseProps = {
      showModal: openModal === modalType,
      onClose: () => {
        setOpenModal(null);
        setSingleSelectedRow(null);
      },
      onSuccess: () => {
        tableRef.current?.resetSelectedRows();
        fetchData();
        setOpenModal(null);
      },
    };

    switch (type) {
      case 'applicaties':
        switch (modalType) {
          case 'add':
          case 'edit':
            return {
              ...baseProps,
              applicatie: singleSelectedRow,
              isEdit: modalType === 'edit',
            };
          case 'delete':
            return {
              ...baseProps,
              applicaties: singleSelectedRow ? [singleSelectedRow] : selectedRows,
            };
          case 'import':
            return {
              ...baseProps,
              register: config.registerSlug,
              schema: config.schemaSlug,
            };
          default:
            return baseProps;
        }

      case 'diensten':
        switch (modalType) {
          case 'add':
          case 'edit':
            return {
              ...baseProps,
              dienst: singleSelectedRow,
              preSelectedVoorziening: params.voorzieningId,
              isEdit: modalType === 'edit',
            };
          case 'delete':
            return {
              ...baseProps,
              diensten: singleSelectedRow ? [singleSelectedRow] : selectedRows,
            };
          case 'import':
            return {
              ...baseProps,
              register: config.registerSlug,
              schema: config.schemaSlug,
            };
          default:
            return baseProps;
        }

      case 'voorzieningen-versie':
        switch (modalType) {
          case 'add':
          case 'edit':
            return {
              ...baseProps,
              voorziening: singleSelectedRow,
              isEdit: modalType === 'edit',
            };
          case 'delete':
            return {
              ...baseProps,
              voorzieningen: singleSelectedRow ? [singleSelectedRow] : selectedRows,
            };
          case 'import':
            return {
              ...baseProps,
              register: config.registerSlug,
              schema: config.schemaSlug,
            };
          default:
            return baseProps;
        }

      case 'organisaties':
        switch (modalType) {
          case 'add':
          case 'edit':
            return {
              ...baseProps,
              organisatie: singleSelectedRow,
              isEdit: modalType === 'edit',
            };
          case 'delete':
            return {
              ...baseProps,
              organisaties: singleSelectedRow ? [singleSelectedRow] : selectedRows,
            };
          case 'activate':
          case 'deactivate':
            return {
              ...baseProps,
              organization: singleSelectedRow,
              activate: modalType === 'activate',
            };
          case 'publish':
          case 'depublish':
            return {
              ...baseProps,
              organization: singleSelectedRow,
              publish: modalType === 'publish',
            };
          case 'addDeelname':
          case 'removeDeelname':
            return {
              ...baseProps,
              organization: singleSelectedRow,
              remove: modalType === 'removeDeelname',
            };
          case 'import':
            return {
              ...baseProps,
              register: config.registerSlug,
              schema: config.schemaSlug,
            };
          default:
            return baseProps;
        }

      case 'kwetsbaarheden':
        switch (modalType) {
          case 'add':
          case 'edit':
            return {
              ...baseProps,
              kwetsbaarheid: singleSelectedRow,
              isEdit: modalType === 'edit',
            };
          case 'delete':
            return {
              ...baseProps,
              kwetsbaarheden: singleSelectedRow ? [singleSelectedRow] : selectedRows,
            };
          case 'import':
            return {
              ...baseProps,
              register: config.registerSlug,
              schema: config.schemaSlug,
            };
          default:
            return baseProps;
        }

      case 'gebruiken':
        switch (modalType) {
          case 'add':
          case 'edit':
            return {
              ...baseProps,
              gebruik: singleSelectedRow,
              preSelectedVoorzieningId: params.voorzieningId,
              isEdit: modalType === 'edit',
            };
          case 'delete':
            return {
              ...baseProps,
              gebruiken: singleSelectedRow ? [singleSelectedRow] : selectedRows,
            };
          case 'koppelen':
            return {
              ...baseProps,
              gebruik: singleSelectedRow,
            };
          case 'import':
            return {
              ...baseProps,
              register: config.registerSlug,
              schema: config.schemaSlug,
            };
          default:
            return baseProps;
        }

      case 'overeenkomsten':
        switch (modalType) {
          case 'add':
          case 'edit':
            return {
              ...baseProps,
              overeenkomst: singleSelectedRow,
              isEdit: modalType === 'edit',
            };
          case 'delete':
            return {
              ...baseProps,
              overeenkomsten: singleSelectedRow ? [singleSelectedRow] : selectedRows,
            };
          case 'import':
            return {
              ...baseProps,
              register: config.registerSlug,
              schema: config.schemaSlug,
            };
          default:
            return baseProps;
        }

      case 'contactpersonen':
        switch (modalType) {
          case 'add':
          case 'edit':
            return {
              ...baseProps,
              contactpersoon: singleSelectedRow,
              isEdit: modalType === 'edit',
            };
          case 'delete':
            return {
              ...baseProps,
              contactpersonen: singleSelectedRow
                ? [singleSelectedRow]
                : selectedRows,
            };
          case 'publish':
          case 'depublish':
            return {
              ...baseProps,
              contactpersoon: singleSelectedRow,
              publish: modalType === 'publish',
            };
          case 'import':
            return {
              ...baseProps,
              register: config.registerSlug,
              schema: config.schemaSlug,
            };
          default:
            return baseProps;
        }

      default:
        return baseProps;
    }
  },

  /**
   * Render all modals for a specific beheer type
   * @param {string} type - The beheer page type
   * @param {Object} params - Parameters for the modals
   * @returns {Array} Array of modal components
   */
  renderModals: (type, params) => {
    const { config } = params;
    const modals = [];

    // Always render all modals for this type, just like the original pages do
    // This ensures the modal components are always mounted and ready
    config.modals.forEach((modalType) => {
      const ModalComponent = BeheerModalFactory.getModalComponent(type, modalType);
      if (!ModalComponent) {
        console.warn(
          `No modal component found for type: ${type}, modal: ${modalType}`
        );
        return;
      }

      const modalProps = BeheerModalFactory.getModalProps(type, modalType, params);

      modals.push(<ModalComponent key={`${type}-${modalType}`} {...modalProps} />);
    });

    return modals;
  },
};

export default BeheerModalFactory;
