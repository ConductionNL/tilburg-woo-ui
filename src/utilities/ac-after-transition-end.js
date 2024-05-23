// Imports => Utilities
import { AcIsUndefined, AcIsNull } from './ac-get-type-of';

const TransitionProperties = ['height', 'max-height', 'width'];
let AnimationEndEvent = null;
let TransitionEndEvent = null;
let TransitionStartEvent = null;
let _delay = null;

const getAnimationEndEvent = () => {
  if (!AcIsNull(AnimationEndEvent)) return AnimationEndEvent;

  const el = document.createElement('div');
  let result = null;
  let t;

  const animations = {
    animation: 'animationend',
    OAnimation: 'oAnimationEnd',
    MozAnimation: 'animationend',
    WebkitAnimation: 'webkitAnimationEnd',
  };

  for (t in animations) {
    if (!AcIsUndefined(el.style[t])) {
      result = animations[t];
      break;
    }
  }

  AnimationEndEvent = result;

  return result;
};

const getTransitionEndEvent = () => {
  if (!AcIsNull(TransitionEndEvent)) return TransitionEndEvent;

  const el = document.createElement('div');
  let result = null;
  let t;

  const transitions = {
    transition: 'transitionend',
    OTransition: 'oTransitionEnd',
    MozTransition: 'transitionend',
    WebkitTransition: 'webkitTransitionEnd',
  };

  for (t in transitions) {
    if (!AcIsUndefined(el.style[t])) {
      result = transitions[t];
      break;
    }
  }

  TransitionEndEvent = result;

  return result;
};

const getTransitionStartEvent = () => {
  if (!AcIsNull(TransitionStartEvent)) return TransitionStartEvent;

  const el = document.createElement('div');
  let result = null;
  let t;

  const transitions = {
    transition: 'transitionstart',
    OTransition: 'oTransitionStart',
    MozTransition: 'transitionstart',
    WebkitTransition: 'webkitTransitionStart',
  };

  for (t in transitions) {
    if (!AcIsUndefined(el.style[t])) {
      result = transitions[t];
      break;
    }
  }

  TransitionEndEvent = result;

  return result;
};

export const AcAfterTransitionEnd = ($element, callback) => {
  const transitionEndEvent = getTransitionEndEvent();
  const transitionStartEvent = getTransitionStartEvent();

  if (_delay) clearTimeout(_delay);

  if ($element && callback) {
    if ($element.hasAttribute('has-transition-listener')) return;
    $element.setAttribute('has-transition-listener', true);
    $element.addEventListener(
      transitionStartEvent,
      (event) => {
        if (event && event.propertyName) {
          if (TransitionProperties.indexOf(event.propertyName) === -1) return;
        }

        if (_delay) clearTimeout(_delay);
      },
      false
    );
    $element.addEventListener(
      transitionEndEvent,
      (event) => {
        if (event && event.propertyName) {
          if (TransitionProperties.indexOf(event.propertyName) === -1) return;
        }

        if (_delay) clearTimeout(_delay);
        const time = (event.elapsedTime < 0.4 ? 0.4 : event.elapsedTime) * 1000;
        _delay = setTimeout(callback, time);
      },
      false
    );
  }
};

export default AcAfterTransitionEnd;
