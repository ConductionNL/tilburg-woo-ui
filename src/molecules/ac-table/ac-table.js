import {
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableRow,
  TableFooter,
  TableHeaderCell,
} from '@utrecht/component-library-react/dist/css-module';

const AcTable = ({ header = [], rows = [], footer = [] }) => {
  console.log(rows);

  return (
    <Table>
      {Array.isArray(header) && (
        <TableHeader>
          <TableRow>
            {header.map((column) => (
              <TableHeaderCell scope='col'>{column}</TableHeaderCell>
            ))}
          </TableRow>
        </TableHeader>
      )}
      {Array.isArray(rows) && (
        <TableBody>
          {rows.map((row) => (
            <TableRow>
              {row.map((cell) => (
                <TableCell>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      )}
      {Array.isArray(footer) && (
        <TableFooter>
          <TableRow>
            {footer.map((column) => (
              <TableCell>{column}</TableCell>
            ))}
          </TableRow>
        </TableFooter>
      )}
    </Table>
  );
};

export default AcTable;
