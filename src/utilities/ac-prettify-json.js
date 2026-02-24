export const AcJSONReplacer = (match, p1, p2, p3, p4) => {
  // Converts the four parenthesized capture groups into HTML
  const part = {indent: p1, key: p2, value: p3, end: p4};
  const key = '<span class=json-key>';
  const val = '<span class=json-value>';
  const bool = '<span class=json-boolean>';
  const str = '<span class=json-string>';
  const isBool = ['true', 'false'].includes(part.value);
  const valSpan = /^"/.test(part.value) ? str : isBool ? bool : val;
  const findName = /"([\w]+)": |(.*): /;
  const indentHtml = part.indent || '';
  const keyName = part.key && part.key.replace(findName, '$1$2');
  const keyHtml = part.key ? key + keyName + '</span>: ' : '';
  const valueHtml = part.value ? valSpan + part.value + '</span>' : '';
  const endHtml = part.end || '';
  return indentHtml + keyHtml + valueHtml + endHtml;
};

export const AcPrettifyJSON = (thing, options = {}) => {
  const defaults = {indent: 3, linkUrls: true, quoteKeys: false};
  const settings = {...defaults, ...options};
  const htmlEntities = text => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/\\"/g, '&bsol;&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };
  const spanTag = (type, display) =>
    display ? '<span class=json-' + type + '>' + display + '</span>' : '';
  const buildValueHtml = value => {
    const strType = /^"/.test(value) && 'string';
    const boolType = ['true', 'false'].includes(value) && 'boolean';
    const nullType = value === 'null' && 'null';
    const type = boolType || nullType || strType || 'number';
    const urlRegex = /https?:\/\/[^\s"]+/g;
    const makeLink = link => '<a class=json-link href="' + link + '">' + link + '</a>';
    const display = strType && settings.linkUrls ? value.replace(urlRegex, makeLink) : value;
    return spanTag(type, display);
  };
  const replacer = (match, p1, p2, p3, p4) => {
    const part = {indent: p1, key: p2, value: p3, end: p4};
    const findName = settings.quoteKeys ? /(.*)(): / : /"([\w$]+)": |(.*): /;
    const indentHtml = part.indent || '';
    const keyName = part.key && part.key.replace(findName, '$1$2');
    const keyHtml = part.key ? spanTag('key', keyName) + spanTag('mark', ': ') : '';
    const valueHtml = part.value ? buildValueHtml(part.value) : '';
    const endHtml = spanTag('mark', part.end);
    return indentHtml + keyHtml + valueHtml + endHtml;
  };
  const jsonLine = /^( *)("[^"]+": )?("[^"]*"|[\w.+-]*)?([{}[\],]*)?$/gm;
  const json = JSON.stringify(thing, null, settings.indent) || 'undefined';
  return htmlEntities(json).replace(jsonLine, replacer);
};
