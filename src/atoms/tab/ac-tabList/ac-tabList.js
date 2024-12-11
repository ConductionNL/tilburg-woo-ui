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
      setCanScrollLeft(wrapperRef.current.scrollLeft > 0);
      setCanScrollRight(
        wrapperRef.current.scrollWidth - wrapperRef.current.scrollLeft >
          wrapperRef.current.clientWidth
      );
    }
  };

  const handleScrollRight = () => {
    if (wrapperRef.current)
      wrapperRef.current.scrollTo({
        left: wrapperRef.current.scrollLeft + wrapperRef.current.clientWidth * 0.9,
        behavior: 'smooth',
      });
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
      setCanScrollRight(
        wrapperRef.current.scrollWidth > wrapperRef.current.clientWidth
      ); // initiate scroll
    }
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
