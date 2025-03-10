import React, { useState, useRef } from 'react';
import clsx from 'clsx';

const AcTabList = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(0);
  const tabRefs = useRef([]);

  // Handle keyboard navigation
  const handleKeyDown = (event, index) => {
    const tabCount = tabs.length;
    let nextIndex = activeTab;

    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (activeTab + 1) % tabCount;
        break;
      case 'ArrowLeft':
        nextIndex = (activeTab - 1 + tabCount) % tabCount;
        break;
      default:
        return;
    }

    setActiveTab(nextIndex);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="ac-tablist">
      <div className="ac-tablist__tabs" role="tablist">
        {tabs.map((tab, index) => (
          <button
            key={`tab-${index}`}
            ref={(el) => (tabRefs.current[index] = el)}
            className={clsx('ac-tablist__tab', {
              'ac-tablist__tab--active': activeTab === index,
            })}
            role="tab"
            id={`tab-${index}`}
            aria-controls={`panel-${index}`}
            aria-selected={activeTab === index}
            tabIndex={activeTab === index ? 0 : -1}
            onClick={() => setActiveTab(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {tabs.map((tab, index) => (
        <div
          key={`panel-${index}`}
          className={clsx('ac-tablist__panel', {
            'ac-tablist__panel--active': activeTab === index,
          })}
          role="tabpanel"
          id={`panel-${index}`}
          aria-labelledby={`tab-${index}`}
          aria-hidden={activeTab !== index}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
};

export default AcTabList;
