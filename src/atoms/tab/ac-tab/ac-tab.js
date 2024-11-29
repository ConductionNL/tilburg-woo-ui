
import * as React from "react"
import {
    Tab as RTab,
} from "react-tabs"


const AcTab = ({ children, ...otherProps }) => (
    <RTab tabIndex="0" className="ac-tab" {...otherProps}>
        {children}
    </RTab>
)

AcTab.tabsRole = "Tab"

export default AcTab;
