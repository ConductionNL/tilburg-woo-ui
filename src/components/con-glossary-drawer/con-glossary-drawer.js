import React, { useEffect, useRef, useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { useLocation } from 'react-router-dom';
import { withStore } from '@stores';
import { AcDrawer, AcSearchFilter, AcTabList } from '@components';
import { AcFlex } from '@atoms';
import {
  Heading,
  Paragraph,
  Link,
} from '@utrecht/component-library-react/dist/css-module';

/**
 * ConGlossaryDrawer
 *
 * Global glossary drawer sidebar with two tabs:
 * - "Deze pagina": shows glossary terms found on the current page
 * - "Alle begrippen": shows all glossary terms with search
 *
 * Controlled by the glossary store. Hidden on /beheer pages.
 */
const ConGlossaryDrawer = observer(({ store }) => {
  const { glossary } = store;
  const drawerRef = useRef(null);
  const location = useLocation();
  const [filteredTerms, setFilteredTerms] = useState([]);
  const [searchActive, setSearchActive] = useState(false);
  const termRefs = useRef({});

  // Reset page terms on route change
  useEffect(() => {
    glossary.resetPageTerms();
  }, [location.pathname, glossary]);

  // Sync drawer open state with the dialog element
  useEffect(() => {
    if (glossary.drawerOpen) {
      drawerRef.current?.showModal();
    } else {
      drawerRef.current?.close();
    }
  }, [glossary.drawerOpen]);

  // Scroll to active term when drawer opens with a specific term
  useEffect(() => {
    if (glossary.drawerOpen && glossary.activeTermId) {
      // Small delay to allow drawer animation to start
      const timer = setTimeout(() => {
        const el = termRefs.current[glossary.activeTermId];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('con-glossary-drawer__term--highlighted');
          setTimeout(
            () =>
              el.classList.remove('con-glossary-drawer__term--highlighted'),
            2000
          );
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [glossary.drawerOpen, glossary.activeTermId]);

  // Listen for dialog close event (when user clicks backdrop or presses Escape)
  useEffect(() => {
    const dialog = drawerRef.current;
    if (!dialog) return;

    const handleClose = () => {
      glossary.closeDrawer();
    };

    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [glossary]);

  // Don't render on beheer pages
  if (location.pathname.startsWith('/beheer')) {
    return null;
  }

  const handleSearch = useCallback(
    (searchTerm) => {
      if (!searchTerm) {
        setFilteredTerms([]);
        setSearchActive(false);
        return glossary.all_terms.length;
      }

      setSearchActive(true);
      const lower = searchTerm.toLowerCase();
      const filtered = glossary.all_terms.filter(
        (term) =>
          term.title?.toLowerCase().includes(lower) ||
          term.summary?.toLowerCase().includes(lower) ||
          term.description?.toLowerCase().includes(lower)
      );
      setFilteredTerms(filtered);
      return filtered.length;
    },
    [glossary.all_terms]
  );

  const renderTerm = (term) => (
    <div
      key={term.id}
      ref={(el) => (termRefs.current[term.id] = el)}
      className='con-glossary-drawer__term'
      data-term-id={term.id}
    >
      <Heading level={3}>{term.title}</Heading>
      <Paragraph>{term.summary || term.description || ''}</Paragraph>
      {term.externalLink && (
        <Link href={term.externalLink} target='_blank' rel='noopener noreferrer'>
          Meer informatie
        </Link>
      )}
    </div>
  );

  const pageTerms = glossary.page_terms;
  const allTerms = searchActive ? filteredTerms : glossary.all_terms;

  // Sort terms alphabetically
  const sortedPageTerms = [...pageTerms].sort((a, b) =>
    (a.title || '').localeCompare(b.title || '', 'nl')
  );
  const sortedAllTerms = [...allTerms].sort((a, b) =>
    (a.title || '').localeCompare(b.title || '', 'nl')
  );

  const tabs = [
    {
      title: 'Deze pagina',
      content:
        sortedPageTerms.length > 0 ? (
          <AcFlex column spacing='sm'>
            {sortedPageTerms.map(renderTerm)}
          </AcFlex>
        ) : (
          <Paragraph>Geen begrippen gevonden op deze pagina.</Paragraph>
        ),
    },
    {
      title: 'Alle begrippen',
      content: (
        <AcFlex column spacing='sm'>
          <AcSearchFilter
            onSearch={handleSearch}
            ariaLabel='Zoek in alle begrippen'
            label='Zoek in alle begrippen'
            searchIconOnly={true}
          />
          {sortedAllTerms.length > 0 ? (
            sortedAllTerms.map(renderTerm)
          ) : (
            <Paragraph>Geen begrippen gevonden.</Paragraph>
          )}
        </AcFlex>
      ),
    },
  ];

  return (
    <AcDrawer
      id='glossary-drawer'
      ref={drawerRef}
      title='Begrippenlijst'
    >
      <AcTabList tabs={tabs} />
    </AcDrawer>
  );
});

ConGlossaryDrawer.displayName = 'ConGlossaryDrawer';

export default withStore(ConGlossaryDrawer);
