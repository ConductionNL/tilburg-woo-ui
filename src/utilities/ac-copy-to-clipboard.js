// Imports => Utilities
import {AcIsSet} from './ac-get-type-of';

export const AcCopyToClipboard = (element = null, text = null) => {
  return new Promise((resolve, reject) => {
    if (!AcIsSet(text) && !AcIsSet(element)) reject('No value to copy');

    const textToCopy = text || (element && element.innerText);
    const myTemporaryInputElement = document.createElement('input');

    myTemporaryInputElement.type = 'text';
    myTemporaryInputElement.value = textToCopy;
    myTemporaryInputElement.style = 'position:absolute;left:-9999999rem;';

    document.body.appendChild(myTemporaryInputElement);

    myTemporaryInputElement.select();

    if (document.execCommand('Copy')) {
      resolve();
    }

    document.body.removeChild(myTemporaryInputElement);
  });
};

export default AcCopyToClipboard;
