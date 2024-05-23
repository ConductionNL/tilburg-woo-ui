let focusAndOpenTimeout = null;

export const AcFocusAndOpenKeyboard = (
  $field,
  timeout = 100,
  remove = true
) => {
  if (focusAndOpenTimeout) clearTimeout(focusAndOpenTimeout);
  if ($field) {
    // Align temp input element approximately where the input element is
    // so the cursor doesn't jump around
    const __tempEl__ = document.createElement('input');
    __tempEl__.style.position = 'absolute';
    __tempEl__.style.top = $field.offsetTop + 7 + 'px';
    __tempEl__.style.left = $field.offsetLeft + 'px';
    __tempEl__.style.height = 0;
    __tempEl__.style.opacity = 0;
    // Put this temp element as a child of the page <body> and focus on it
    document.body.appendChild(__tempEl__);
    __tempEl__.focus();

    $field.addEventListener(
      'touchstart',
      () => {
        $field.focus();
      },
      false
    );

    $field.addEventListener(
      'click',
      () => {
        $field.focus();
      },
      false
    );

    // The keyboard is open. Now do a delayed focus on the target element
    focusAndOpenTimeout = setTimeout(() => {
      $field.focus();
      $field.click();

      const event = new Event('touchstart');
      $field.dispatchEvent(event);

      // Remove the temp element
      if (remove) document.body.removeChild(__tempEl__);
    }, timeout);
  }
};

export default AcFocusAndOpenKeyboard;
