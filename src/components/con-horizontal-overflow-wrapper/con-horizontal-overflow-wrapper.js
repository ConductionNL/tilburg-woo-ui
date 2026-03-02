import * as React from 'react';
import clsx from 'clsx';
import { Button } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';

const ConHorizontalOverflowWrapper = ({ children, ariaLabels }) => {
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);

  const wrapperRef = React.useRef(null);
  const contentRef = React.useRef(null);

  const scrollRight = () => {
    wrapperRef.current?.scrollTo({
      left: wrapperRef.current.scrollLeft + wrapperRef.current.clientWidth * 0.9,
      behavior: 'smooth',
    });
  };

  const scrollLeft = () => {
    wrapperRef.current?.scrollTo({
      left: wrapperRef.current.scrollLeft - wrapperRef.current.clientWidth * 0.9,
      behavior: 'smooth',
    });
  };

  const checkScrollDirections = React.useCallback(() => {
    if (!wrapperRef.current || !contentRef.current) return;

    requestAnimationFrame(() => {
      // Check again inside requestAnimationFrame in case component unmounted
      if (!wrapperRef.current || !contentRef.current) return;
      
      const hasHorizontalOverflow =
        contentRef.current.scrollWidth > wrapperRef.current.clientWidth;

      setCanScrollRight(
        hasHorizontalOverflow &&
          wrapperRef.current.scrollLeft + wrapperRef.current.clientWidth <
            contentRef.current.scrollWidth
      );
      setCanScrollLeft(wrapperRef.current.scrollLeft > 0);
    });
  }, []);

  React.useEffect(() => {
    let rafId;
    const resizeObserver = new ResizeObserver(() => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        checkScrollDirections();
      });
    });

    if (wrapperRef.current && contentRef.current) {
      resizeObserver.observe(wrapperRef.current);
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [checkScrollDirections]);

  return (
    <div className='con-horizontal-overflow-wrapper__container'>
      {canScrollLeft && (
        <Button
          className='con-horizontal-overflow-wrapper__scroll-button'
          onClick={scrollLeft}
          appearance='secondary-action-button'
          aria-label={ariaLabels.scrollLeftButton}
        >
          <VISUALS.CHEVRON_LEFT />
        </Button>
      )}

      {canScrollRight && (
        <Button
          className={clsx(
            'con-horizontal-overflow-wrapper__scroll-button',
            'con-horizontal-overflow-wrapper__scroll-button--right'
          )}
          onClick={scrollRight}
          appearance='secondary-action-button'
          aria-label={ariaLabels.scrollRightButton}
        >
          <VISUALS.CHEVRON_RIGHT />
        </Button>
      )}

      <div
        ref={wrapperRef}
        className='con-horizontal-overflow-wrapper__wrapper'
        onScroll={checkScrollDirections}
      >
        <div ref={contentRef} className='con-horizontal-overflow-wrapper__content'>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ConHorizontalOverflowWrapper;
