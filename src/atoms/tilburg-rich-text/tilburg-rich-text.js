// Imports => Utilities
import {AcSanitizeHtml} from "@src/utilities";

const TilburgRichText = ({ content, children }) => {

    if (!content) {
        return null
    }

    return (
        <div>
            {AcSanitizeHtml(content)}
        </div>
    )
}

export default TilburgRichText;
