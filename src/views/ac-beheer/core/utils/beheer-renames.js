// rename from schema to frontend name
// TODO: we dont want this, it should just got via the slug period. But that'll get fixed in the next stage of making this dynamic
// when it does get fixed go to src/views/ac-publication/ac-publication-default.js and remove the dependency on this file
export const BEHEER_RENAMES = {
  voorziening: 'applicaties',
  voorzieningaanbod: 'diensten',
  voorzieninggebruik: 'gebruiken',
  voorzieningversie: 'voorzieningen-versie',
  contract: 'overeenkomsten',
  organisatie: 'organisaties',
  kwetsbaarheid: 'kwetsbaarheden',
  contactpersoon: 'contactpersonen',
  voorzieningmodule: 'voorzieningmodule',
  moduleversie: 'moduleversie',
};
