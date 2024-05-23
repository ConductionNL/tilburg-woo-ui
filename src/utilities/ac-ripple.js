export class AcRippleEffect {
  constructor($element, $target, size, fixed, event) {
    this.$element = $element;
    this.$target = $target ? $target : this.$element.parentNode;
    this.size = size;
    this.fixed = fixed;
    this.event = event;

    this.dimensions = {
      top: 0,
      left: 0,
      width: 0,
      height: 0,
    };

    this.init = this.init.bind(this);
    this.addEvent = this.addEvent.bind(this);
    this.handleEvent = this.handleEvent.bind(this);
    this.setStyles = this.setStyles.bind(this);

    this.init();
    this.addEvent();
  }

  init = () => {
    let targetClient = this.$target.getBoundingClientRect();

    if (!this.$target.hasAttribute('has-ripple'))
      this.$target.setAttribute('has-ripple', true);

    if (this.fixed && !this.$element.hasAttribute('has-ripple-fixed'))
      this.$element.setAttribute('has-ripple-fixed', true);

    let dimensions = {
      width: this.$target.offsetWidth,
      height: this.$target.offsetHeight,
      actual: 0,
      center: 0,
    };

    // Determine the absolute width, height and center of the ripple
    dimensions.actual = Math.max(
      dimensions.width * this.size,
      dimensions.height * this.size
    );
    dimensions.center = dimensions.actual / 2;

    this.dimensions = {
      width: dimensions.actual,
      height: dimensions.actual,
      center: dimensions.center,
      top: targetClient.top - dimensions.center,
      left: targetClient.left - dimensions.center,
      position: targetClient,
    };
  };

  addEvent = () => {
    if (this.$target) {
      this.$target.addEventListener(this.event, this.handleEvent);
    }
  };

  removeEvents = () => {
    if (this.$target) {
      this.$target.removeEventListener(this.event, this.handleEvent);
    }
  };

  handleEvent = (event) => {
    let targetClient = this.$target.getBoundingClientRect();

    // Calculate Cursor Position
    let pos = {
      top: event.clientY - targetClient.top - this.dimensions.center,
      left: event.clientX - targetClient.left - this.dimensions.center,
    };

    this.dimensions.top = pos.top;
    this.dimensions.left = pos.left;

    this.setStyles();
  };

  setStyles = () => {
    let styles = {
      top: `${this.dimensions.top}px`,
      left: `${this.dimensions.left}px`,
      width: `${this.dimensions.width}px`,
      height: `${this.dimensions.height}px`,
    };

    if (this.fixed) {
      styles.top = `${
        this.dimensions.position.height / 2 - this.dimensions.center
      }px`;
      styles.left = `${
        this.dimensions.position.width / 2 - this.dimensions.center
      }px`;
    }

    this.$element.style.top = styles.top;
    this.$element.style.left = styles.left;
    this.$element.style.width = styles.width;
    this.$element.style.height = styles.height;
  };
}

export default AcRippleEffect;
