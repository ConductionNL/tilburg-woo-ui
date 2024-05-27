import clsx from 'clsx'

const TilburgNavigation = () => {

    const _CLASSES = clsx('tilburg-navigation')

    return (
        <nav className={_CLASSES} aria-label="Navigation">
            <ul>
                <li>
                    <a href="/">
                        <svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g fillRule="evenodd" clipRule="evenodd" fill="#fff">
                                <path
                                    d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM0 10C0 4.477 4.477 0 10 0s10 4.477 10 10-4.477 10-10 10S0 15.523 0 10Z" />
                                <path
                                    d="M9 6a1 1 0 0 1 1-1h.01a1 1 0 1 1 0 2H10a1 1 0 0 1-1-1ZM8 10a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v3a1 1 0 1 1 0 2h-1a1 1 0 0 1-1-1v-3a1 1 0 0 1-1-1Z" />
                            </g>
                        </svg>
                        Over Open Tilburg
                    </a>
                </li>
                <li>
                    <a href="/about">
                        <svg width="20" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd"
                                  d="M0 2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2Zm6 0H2v4h4V2Zm4 0a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2h-8a1 1 0 0 1-1-1Zm0 4a1 1 0 0 1 1-1h5a1 1 0 1 1 0 2h-5a1 1 0 0 1-1-1ZM0 12a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-4Zm6 0H2v4h4v-4Zm4 0a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2h-8a1 1 0 0 1-1-1Zm0 4a1 1 0 0 1 1-1h5a1 1 0 1 1 0 2h-5a1 1 0 0 1-1-1Z"
                                  fill="#fff" />
                        </svg>
                        Onderwerpen
                    </a>
                </li>
                <li>
                    <a href="/contact">
                        <svg width="20" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd"
                                  d="M0 3a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V3Zm2.112-.46L10 7.798l7.888-5.258A1 1 0 0 0 17 2H3a1 1 0 0 0-.888.54ZM18 4.869l-7.445 4.963a1 1 0 0 1-1.11 0L2 4.87V13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4.869Z"
                                  fill="#fff" />
                        </svg>
                        Contact
                    </a>
                </li>
            </ul>
        </nav>
    );
}
export default TilburgNavigation
