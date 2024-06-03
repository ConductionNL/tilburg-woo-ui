import { DataList, DataListItem, DataListKey, DataListValue, Link } from '@utrecht/component-library-react/dist/css-module';
import {
    Table,
    TableBody,
    TableRow,
    TableCell,
} from '@utrecht/component-library-react/dist/css-module';

const TilburgDataList = ({rows = []}) => {

    const renderDataListValue = (row) => {
        return row.url ?
            <Link href={row.url} target="_blank" rel="noreferrer">{row.label}</Link> :
            row.label
    }

    return (
        <>
            <Table>
                <TableBody>
                    {rows.map((row, index) =>
                        <TableRow key={index}>
                            <TableCell><b>{row.text}</b></TableCell>
                            <TableCell>{renderDataListValue(row)}</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </>
    )
}

export default TilburgDataList
