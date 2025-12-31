
export const VersionDisplay = () => {
    return (
        <div style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            fontSize: '0.8rem',
            opacity: 0.5,
            pointerEvents: 'none',
            zIndex: 1000,
        }}>
            v{__APP_VERSION__}
        </div>
    );
};
