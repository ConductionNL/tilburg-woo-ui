export const AcRemoveTags = (string) => {
  if (typeof string !== 'string') {
    return string;
  }
  return string.replace(/(<([^>]+)>)/gi, '');
};

export const AcRemoveParagraphTags = (string) => {
  if (typeof string !== 'string') {
    return string;
  }
  return string.replace(/<\/?p>/g, '');
};
