// Imports => Utilities
import { AcIsSet, AcIsEmptyString } from '@utils';

export class AcSliderInputInstance {
  constructor(value, callback) {
    this.number_of_options = 0;
    this.options = [];

    this.value = value;
    this.callback = callback;

    this.dragging = false;
    this.delay = null;

    this.position = {
      initial: {
        x: 0,
      },
      current: {
        x: 0,
      },
      offset: {
        x: 0,
      },
    };

    this.addEvents();
  }

  getElements = () => {
    return new Promise((resolve) => {
      const $options = document.querySelectorAll('.ac-slider-input__option');

      resolve($options);
    });
  };

  getClosest = (num) => {
    const arr = this.options;

    let curr = arr[0].position;
    let diff = Math.abs(num - curr);

    const len = arr.length;
    let n = 0;
    let closest = 1;

    for (n; n < len; n++) {
      const new_diff = Math.abs(num - arr[n].position);

      if (new_diff < diff) {
        diff = new_diff;
        curr = arr[n].position;
        closest = n + 1;
      }
    }

    return closest;
  };

  addEvents = async () => {
    const $options = await this.getElements();
    const $container = document.querySelector('.ac-slider-input');
    const $tracker = $container.querySelector('.ac-slider-input__tracker');
    const $knob = $container.querySelector('.ac-slider-input__knob');

    this.elements = {
      $container,
      $tracker,
      $knob,
    };

    const len = $options.length;
    let n = 0;

    const tracker_rect = $tracker.getBoundingClientRect();
    const knob_rect = $knob.getBoundingClientRect();

    const knob_width = knob_rect.width;
    const knob_center = knob_rect.width / 2;
    const tracker_width = tracker_rect.width;
    const tracker_center = tracker_rect.width / 2;

    for (n; n < len; n++) {
      const $el = $options[n];
      const rect = $el.getBoundingClientRect();

      $el.addEventListener('click', () => this.handleClick($el), false);

      let position = 0;
      if (n === 0) position = 0;
      else if (n === 1) position = rect.x - knob_center - 3;
      else if (n === 2) position = tracker_center - knob_center;
      else if (n === 3) position = rect.x + 3;
      else if (n === 4) position = tracker_width - knob_width;

      this.options.push({
        $el,
        value: n + 1,
        position,
      });
    }

    $tracker.addEventListener('touchstart', this.handleMouseDown, false);
    $tracker.addEventListener('touchmove', this.handleMouseMove, false);
    $tracker.addEventListener('touchend', this.handleMouseUp, false);

    this.number_of_options = len;
    this.calculateKnobPosition(
      AcIsSet(this.value) && !AcIsEmptyString(this.value) ? this.value : 3
    );
  };

  removeEvents = () => {
    return new Promise((resolve) => {
      this.getElements().then(($options) => {
        const $container = document.querySelector('.ac-slider-input');
        const $tracker = $container.querySelector('.ac-slider-input__tracker');

        const len = $options.length;
        let n = 0;

        for (n; n < len; n++) {
          const $el = $options[n];

          $el.removeEventListener('click', () => this.handleClick($el), false);
        }

        $tracker.removeEventListener('touchstart', this.handleMouseDown, false);
        $tracker.removeEventListener('touchmove', this.handleMouseMove, false);
        $tracker.removeEventListener('touchend', this.handleMouseUp, false);

        resolve();
      });
    });
  };

  handleClick = ($option) => {
    const $radio = $option.querySelector('input[type="radio"]');
    const value = $radio.getAttribute('value');

    // if (this.value === value) return;

    this.calculateKnobPosition(value);
  };

  handleMouseDown = (event) => {
    if (event?.preventDefault) event.preventDefault();
    if (event?.stopPropagation) event.stopPropagation();

    if (event) {
      if (event.type === 'touchstart') {
        this.position.initial.x = event.touches[0].clientX - this.position.initial.x;
      } else {
        this.position.initial.x = event.clientX - this.position.initial.x;
      }

      if (event.target === this.elements.$knob) this.dragging = true;
    }
  };

  handleMouseUp = (event) => {
    if (event?.preventDefault) event.preventDefault();
    if (event?.stopPropagation) event.stopPropagation();

    if (this.delay) clearTimeout(this.delay);

    this.position.initial.x = this.position.current.x;

    this.dragging = false;

    this.delay = setTimeout(() => {
      const closest = this.getClosest(this.position.initial.x);
      if (closest) this.calculateKnobPosition(closest);
    }, 200);
  };

  handleMouseMove = (event) => {
    if (event?.preventDefault) event.preventDefault();
    if (event?.stopPropagation) event.stopPropagation();

    if (this.dragging && event) {
      if (event?.preventDefault) event.preventDefault();

      if (event.type === 'touchmove') {
        this.position.current.x = event.touches[0].clientX - this.position.initial.x;
      } else {
        this.position.current.x = event.clientX - this.position.initial.x;
      }

      this.position.offset.x = this.position.current.x;

      this.updateKnobPosition();
    }
  };

  updateKnobPosition = () => {
    const { current } = this.position;

    this.elements.$knob.style.transition = 'transform 0s';
    this.elements.$knob.style.transform = `translate3d(${current.x}px, 0, 0)`;
  };

  calculateKnobPosition = (value) => {
    return new Promise((resolve) => {
      const styles = {
        x: AcIsSet(this.options[value - 1]) ? this.options[value - 1].position : 0,
      };

      this.updateKnobStyles(styles)
        .then(() => {
          if (this.callback) this.callback(value);
          resolve();
        });
    });
  };

  updateKnobStyles = async (styles) => {
    if (this.delay) clearTimeout(this.delay);

    this.elements.$knob.style.transition = 'transform 250ms ease-in-out';
    this.elements.$knob.style.transform = `translate3d(${styles.x}px, 0, 0)`;

    this.position.initial.x = styles.x;
    this.position.current.x = styles.x;
    this.position.offset.x = 0;
  };

  destroy = async () => {
    return await this.removeEvents();
  };
}

export default AcSliderInputInstance;
