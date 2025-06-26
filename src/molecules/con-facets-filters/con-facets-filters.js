import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';

import { AcCheckbox } from '@molecules';
import { LABELS } from '@constants';
import { withStore } from '@stores';

import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { AcFlex } from '@atoms';
import _ from 'lodash';

const ConFacetsFilters = ({ store: { publications } }) => {
  const [facets, setFacets] = useState(null);
  const { theme_checked, toggleSearchArrayValue } = publications;

  const facetsQueries = [
    ['type', 'terms'],
    [['@self', 'schema'], 'terms'],
  ];

  useEffect(() => {
    const fetchFacets = async () => {
      try {
        const queryParams = facetsQueries
          .map(([key, value]) => {
            if (Array.isArray(key)) {
              const brackets = key.map((val) => `[${val}]`).join('');
              return `_facets${brackets}=${value}`;
            } else {
              return `_facets[${key}]=${value}`;
            }
          })
          .join('&');

        const response = await fetch(
          `https://vng.test.commonground.nu/apps/opencatalogi/api/publications?_facetable=true&${queryParams}`
        );

        if (!response.ok) {
          console.error('Error fetching facets:', response.statusText);
          return;
        }

        const data = await response.json();
        setFacets(data.facets);
      } catch (error) {
        console.error('Error fetching facets:', error);
      }
    };

    fetchFacets();
  }, []);

  return (
    <>
      {facets &&
        Object.keys(facets).length > 0 &&
        Object.entries(facets).map(([key, value]) => {
          return key === '@self' ? (
            <>
              {console.log({ value })}
              {Object.entries(value).map(([_key, _value]) => (
                <AcFlex
                  key={key}
                  column
                  spacing='xs'
                  className='ac-search-filters__subjects'
                >
                  <Heading level={4}>{_.upperFirst(_key)}</Heading>
                  {_value.buckets.map((bucket) => (
                    <AcCheckbox
                      key={bucket.key}
                      label={`${bucket.label ?? bucket.key} (${bucket.results})`}
                      value={bucket.key}
                      checked={theme_checked(bucket.key)}
                      onChange={() =>
                        toggleSearchArrayValue(`${key}[${_key}]`, bucket.key)
                      }
                    />
                  ))}
                </AcFlex>
              ))}
            </>
          ) : (
            <AcFlex
              key={key}
              column
              spacing='xs'
              className='ac-search-filters__subjects'
            >
              <Heading level={4}>{_.upperFirst(key)}</Heading>
              {value.buckets.map((value) => (
                <AcCheckbox
                  key={value.key}
                  label={`${value.label ?? value.key} (${value.results})`}
                  value={value.key}
                  checked={theme_checked(value.key)}
                  onChange={() => toggleSearchArrayValue(key, value.key)}
                />
              ))}
            </AcFlex>
          );
        })}
    </>
  );
};

export default withStore(observer(ConFacetsFilters));
