export const getImageFromPublication = (publication) => {
  const imageField = publication['@self']?.schema?.configuration?.objectImageField;
  if (imageField && publication['@self']?.[imageField]) {
    // Use the configured image field from the publication data if it exists
    return publication['@self']?.[imageField] || publication[imageField];
  }

  // Fallback to '@self.image' if no objectImageField is configured or filled
  return publication['@self']?.image || publication?.image || publication?.logo;
};
