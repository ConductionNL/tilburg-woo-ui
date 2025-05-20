export const getTitle = () => {
  const hostname = window.location.hostname;

  switch (hostname) {
    case 'vng.opencatalogi.nl':
    case 'vng.test.opencatalogi.nl':
      return 'Softwarecatalogus';
    case 'open-tilburg.accept.commonground.nu':
      return 'Open Tilburg';
    case 'open-dimpact.accept.commonground.nu':
    case 'dimpact.opencatalogi.nl':
      return 'Producten catalogus';
    case 'open-rotterdam.accept.commonground.nu':
      return 'Open Rotterdam';
    case 'open-migrato.accept.commonground.nu':
      return 'Open Migrato';
    case 'opencatalogi.nl':
    case 'developer.opencatalogi.nl':
    case 'test.opencatalogi.nl':
      return 'OpenCatalogi';
    case 'opencatalogi.open-regels.nl':
      return 'OpenRegels';
    case 'horstadmaas.accept.opencatalogi.nl':
      return 'Horst aan de Maas';
    case 'localhost':
      return 'Localhost catalogus';
    default:
      return 'Open Tilburg';
  }
};
