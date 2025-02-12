import { LABELS } from '@constants';
import { AcLink } from '@molecules';
import { withStore } from '@stores';

export const AcGetAdditionalInfoRow = (get_single, getSearchPageURL) => {
  let infoArray = [];

  get_single.category &&
    infoArray.push([
      LABELS.CATEGORY,
      <AcLink
        href={getSearchPageURL({
          category: [get_single?.category],
        })}
      >
        {get_single?.category}
      </AcLink>,
    ]);
  get_single.license &&
    infoArray.push(['Licentie', <span>{get_single?.license}</span>]);

  get_single.data?.status &&
    infoArray.push(['Status', <span>{get_single?.data?.status}</span>]);
  get_single.data?.software_type &&
    infoArray.push([
      'Software type',
      <span>{get_single?.data?.software_type}</span>,
    ]);
  get_single.data?.maintenance_type &&
    infoArray.push([
      'Onderhouds type',
      <span>{get_single?.data?.maintenance_type}</span>,
    ]);
  get_single.data?.products &&
    infoArray.push([
      'Products',
      <span className='ac-publication-products'>
        {JSON.parse(get_single?.data?.products || '{}')?.length > 0
          ? JSON.parse(get_single?.data?.products || '{}')?.map((product, idx) =>
              product.url ? (
                <AcLink href={product.url} target='_blank'>
                  {product.label}
                  {idx < JSON.parse(get_single?.data?.products || '{}')?.length - 1
                    ? ', '
                    : ''}
                </AcLink>
              ) : (
                <span>
                  {product.label}
                  {idx < JSON.parse(get_single?.data?.products || '{}')?.length - 1
                    ? ', '
                    : ''}
                </span>
              )
            )
          : '-'}
      </span>,
    ]),
    get_single.data &&
      Object.entries(get_single.data).map(([key, value]) => {

        if (!Object.keys(get_single.publicationType.properties).includes(key)) {
          return;
        }
        const propertyType = get_single.publicationType.properties[key].type;
        const propertyFormat = get_single.publicationType.properties[key].format;

        if (
          key === 'category' ||
          key === 'license' ||
          key === 'status' ||
          key === 'software_type' ||
          key === 'maintenance_type' ||
          key === 'github_url' ||
          key === 'products' ||
          key === 'tabsData'
        ) {
          return;
        }

        switch (propertyType) {
          case 'string':
            infoArray.push([_.upperFirst(key), <span>{value}</span>]);
            break;
          case 'array':
            if (typeof value === 'string' && propertyFormat === 'uri') {
              infoArray.push([
                _.upperFirst(key),
                <span>
                  {value.split(/ *, */g)?.map((_value, idx) => (
                    <AcLink href={_value.replace(/\s/g, '')}>
                      {_value.replace(/\s/g, '')}
                      {idx < value.split(/ *, */g)?.length - 1 ? ', ' : ''}{' '}
                    </AcLink>
                  ))}
                </span>,
              ]);
            } else {
              infoArray.push([
                _.upperFirst(key),
                <span className='ac-publication-products'>
                  {value.split(/ *, */g)?.map((_value, idx) => (
                    <span>
                      {_value.replace(/\s/g, '')}
                      {idx < value.split(/ *, */g)?.length - 1 ? ', ' : ''}{' '}
                    </span>
                  ))}
                </span>,
              ]);
            }
            break;
          case 'object':
            infoArray.push([
              _.upperFirst(key),
              <pre>{JSON.stringify(JSON.parse(value), null, 2)}</pre>,
            ]);
            break;
          default:
            infoArray.push([_.upperFirst(key), <span>{value}</span>]);
            break;
        }

        infoArray.push([]);
      });
  return infoArray;
};
