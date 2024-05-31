import { DataList, DataListItem, DataListKey, DataListValue, Link } from '@utrecht/component-library-react/dist/css-module';

const TilburgDataList = ({rows = []}) => {

    const renderDataListValue = (row) => {
        return row.url ?
            <Link href={row.url} target="_blank" rel="noreferrer">{row.label}</Link> :
            row.label
    }

    return (
        <DataList >
            {rows.map((row, index) =>
                <DataListItem key={index}>
                    <DataListKey>{row.text}</DataListKey>
                    <DataListValue>{renderDataListValue(row)}</DataListValue>
                </DataListItem>
            )}
        </DataList>
    )
}

export default TilburgDataList
