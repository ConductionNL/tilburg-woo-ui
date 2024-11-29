import * as React from "react"
import clsx from "clsx"

const AcLogo = ({ onClick, layoutClassName, variant = "header" }) => {
    return (
        <div
            className={clsx('ac-logo-container', variant, [
                onClick && 'clickable',
                layoutClassName && layoutClassName
            ])}
            {...{ onClick }}
        />
    )
}

export default AcLogo;
