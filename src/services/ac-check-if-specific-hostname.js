export const AcCheckIfSpecificHostname = () => {
  const hostname = window.location.hostname;

  // Production
  const isSpecificHostname = [
    'open-dimpact.accept.commonground.nu',
    'dimpact.opencatalogi.nl',
    'open-rotterdam.accept.commonground.nu',
    'vng.opencatalogi.nl',
    'vng.test.opencatalogi.nl',
    'opencatalogi.nl',
    'developer.opencatalogi.nl',
    'test.opencatalogi.nl',
    'opencatalogi.open-regels.nl',
    'open-migrato.accept.commonground.nu',
    'localhost',
  ].includes(hostname);

  return isSpecificHostname;
};
