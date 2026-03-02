const ConDebugViewer = ({ data, title = "data" }) => {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div
      style={{
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        fontSize: '0.8rem',
      }}
    >
      <details>
        <summary
          style={{
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          🐛 Debug: {title} (Click to expand)
        </summary>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '300px',
            overflow: 'auto',
            backgroundColor: '#ffffff',
            padding: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '2px',
            marginTop: '0.5rem',
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
};

ConDebugViewer.displayName = 'ConDebugViewer';

export default ConDebugViewer;
