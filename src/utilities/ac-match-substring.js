export const AcMatchSubString = (query, string, { id }, withTitle = false) => {
  if (!query) return { string, match: false };

  let content = string;
  const pattern = new RegExp(`${query}`, 'i');
  const match = content.match(pattern);

  if (match) {
    let rest = {};

    if (withTitle) {
      rest = `title='Bekijk de definitie van "${query
        .replace('\\b', '')
        .replace('\\b', '')
        .trim()}"'`;
    }

    content = content.replace(
      pattern,
      `<mark rel='${id}' data-glossary-id='${id}' ${rest}>$&</mark>`
    );
  }

  return { content, match };
};

export default AcMatchSubString;
