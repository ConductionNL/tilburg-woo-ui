import * as React from 'react';
import { TabList as RTabList } from 'react-tabs';
import clsx from 'clsx';
import { VISUALS } from '@constants';

const AcTabList = ({ children, ...otherProps }) => {
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);

  const wrapperRef = React.useRef(null);

  const handleScroll = () => {
    if (wrapperRef.current) {
      const scrollLeft = wrapperRef.current.scrollLeft;
      const scrollWidth = wrapperRef.current.scrollWidth;
      const clientWidth = wrapperRef.current.clientWidth;
      // Check if we can scroll right: scrollLeft + clientWidth should be less than scrollWidth
      // Use a tolerance (5px) to account for floating point precision and style changes
      // (selected tabs may have different border/padding that increases scrollWidth slightly)
      const canScrollRightValue = scrollLeft + clientWidth < scrollWidth - 5;
      
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(canScrollRightValue);
    }
  };

  const handleScrollRight = () => {
    if (wrapperRef.current) {
      const maxScroll = wrapperRef.current.scrollWidth - wrapperRef.current.clientWidth;
      const targetScroll = Math.min(
        wrapperRef.current.scrollLeft + wrapperRef.current.clientWidth * 0.9,
        maxScroll
      );
      
      wrapperRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
      
      // Re-check scroll state after smooth scroll completes
      setTimeout(() => {
        handleScroll();
      }, 300);
    }
  };

  const handleScrollLeft = () => {
    if (wrapperRef.current)
      wrapperRef.current.scrollTo({
        left: wrapperRef.current.scrollLeft - wrapperRef.current.clientWidth * 0.9,
        behavior: 'smooth',
      });
  };

  React.useEffect(() => {
    if (wrapperRef.current) {
      handleScroll();
      
      // Observe changes to tab list size (e.g., when tab selection changes styles)
      const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => {
          handleScroll();
        });
      });
      
      // Observe tab selection changes (aria-selected attribute changes)
      const mutationObserver = new MutationObserver(() => {
        requestAnimationFrame(() => {
          handleScroll();
        });
      });
      
      const tabListContainer = wrapperRef.current.querySelector('.ac-tabListContainer');
      if (tabListContainer) {
        resizeObserver.observe(tabListContainer);
        mutationObserver.observe(tabListContainer, {
          attributes: true,
          attributeFilter: ['aria-selected'],
          subtree: true
        });
      }
      
      return () => {
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      };
    }
  }, [children]);
  
  React.useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        handleScroll();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className='ac-tab-container'>
      <div
        onScroll={handleScroll}
        ref={wrapperRef}
        className={clsx('ac-tab-wrapper')}
      >
        <div className='ac-tabListContainer'>
          {canScrollLeft && (
            <div
              onClick={handleScrollLeft}
              className={clsx(
                canScrollLeft && 'ac-tab-scrollLeftButton',
                'ac-tabButton'
              )}
            >
              <span className='ac-tab-scrollButton'>
                <VISUALS.CHEVRON_LEFT />
              </span>
            </div>
          )}
          <RTabList
            className={clsx(
              canScrollRight || canScrollLeft ? 'ac-tabListOverflow' : 'ac-tabList'
            )}
            {...otherProps}
          >
            {children}
          </RTabList>
          {canScrollRight && (
            <div
              onClick={handleScrollRight}
              className={clsx(
                canScrollRight && 'ac-tab-scrollRightButton',
                'ac-tabButton'
              )}
            >
              <span className='ac-tab-scrollButton'>
                <VISUALS.CHEVRON_RIGHT />
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

AcTabList.tabsRole = 'TabList';

export default AcTabList;
