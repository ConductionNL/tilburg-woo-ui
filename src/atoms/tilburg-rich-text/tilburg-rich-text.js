// Imports => Utilities
import {AcSanitizeHtml} from "@src/utilities";
import clsx from 'clsx';

const TilburgRichText = ({ content }) => {

    const _CLASSES = clsx('tilburg-rich-text')

    if (!content) {
        return null
    }

    return (
        <div className={_CLASSES}>
            {AcSanitizeHtml(content)}
        </div>
    )
}

export default TilburgRichText;
