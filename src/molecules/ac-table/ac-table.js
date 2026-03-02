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
  return (
    <Table>
      {Array.isArray(header) && (
        <TableHeader>
          <TableRow>
            {header.map((column) => (
              <TableHeaderCell key={column} scope='col'>{column}</TableHeaderCell>
            ))}
          </TableRow>
        </TableHeader>
      )}
      {Array.isArray(rows) && (
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              {row.map((cell) => (
                <TableCell key={cell}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      )}
      {Array.isArray(footer) && (
        <TableFooter>
          <TableRow>
            {footer.map((column) => (
              <TableCell key={column}>{column}</TableCell>
            ))}
          </TableRow>
        </TableFooter>
      )}
    </Table>
  );
};

export default AcTable;
