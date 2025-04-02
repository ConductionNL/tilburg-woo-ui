import * as React from 'react';
import clsx from 'clsx';
import { Button } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';

const CoHorizontalOverflowWrapper = ({ children, ariaLabels }) => {
  console.log(children);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);

  const wrapperRef = React.useRef(null);

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

  React.useEffect(() => {
    checkScrollDirections(); // initiate available scroll directions

    window.addEventListener('resize', checkScrollDirections);

    return () => window.removeEventListener('resize', checkScrollDirections);
  }, []);

  const checkScrollDirections = () => {
    console.log('wrapperRef.current', wrapperRef.current);
    console.log('wrapperRef.current.scrollLeft', wrapperRef.current.scrollLeft);
    console.log('wrapperRef.current.clientWidth', wrapperRef.current.clientWidth);
    console.log('wrapperRef.current.scrollWidth', wrapperRef.current.scrollWidth);
    
    if (!wrapperRef.current) return;

    setCanScrollRight(
      wrapperRef.current.scrollLeft + wrapperRef.current.clientWidth <
        wrapperRef.current.scrollWidth
    );
    setCanScrollLeft(wrapperRef.current.scrollLeft > 0);

    console.log(canScrollLeft, canScrollRight);
  };

  return (
    <div className='co-horizontal-overflow-wrapper__container'>
      {canScrollLeft && (
        <Button
          className='co-horizontal-overflow-wrapper__scroll-button'
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
            'co-horizontal-overflow-wrapper__scroll-button',
            'co-horizontal-overflow-wrapper__scroll-button--right'
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
        className='co-horizontal-overflow-wrapper__wrapper'
        onScroll={checkScrollDirections}
      >
        {children}
      </div>
    </div>
  );
};

export default CoHorizontalOverflowWrapper;
