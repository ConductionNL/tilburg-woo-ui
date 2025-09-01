import { AcLink } from '@molecules';

import { Link } from '@utrecht/component-library-react/dist/css-module';

import { LABELS, VISUALS } from '@constants';
import acFormatDate from '@src/utilities/ac-format-date';

export const AcMappedAttachmentRow = (row, primary) => {
  const checkIfTitleContainsExtension = row.title.includes(row.extension);

  if (!primary) {
    return [
      <AcLink to={row.accessUrl} target='_blank'>
        <VISUALS.DOCUMENT />
        <Link>
          {`${row.title}${
            checkIfTitleContainsExtension ? '' : '.' + row.extension
          }` || 'Naamloos bestand'}
        </Link>
      </AcLink>,
    ];
  }

  return [
    <AcLink to={row.accessUrl} target='_blank'>
      <VISUALS.DOCUMENT />
      <Link>
        {`${row.title}${checkIfTitleContainsExtension ? '' : '.' + row.extension}` ||
          'Naamloos bestand'}
      </Link>
    </AcLink>,
    row.labels[0] || LABELS.UNKNOWN,
    acFormatDate(row?.published, 'YYYY-MM-DD', 'DD MMMM YYYY') || LABELS.UNKNOWN,
  ];
};
