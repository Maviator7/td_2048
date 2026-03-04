export function EventLog({ log, isDesktop }) {
  return (
    <div
      style={{
        background: "#0d1117",
        border: "1px solid #1e2a3a",
        borderRadius: 10,
        padding: "8px 10px",
        maxHeight: isDesktop ? 220 : 90,
        overflowY: "auto",
      }}
    >
      {log.map((message, index) => (
        <div
          key={`${index}-${message}`}
          style={{
            fontSize: isDesktop ? 12 : 11,
            color: index === 0 ? "#ddd" : "#444",
            marginBottom: 2,
            lineHeight: 1.4,
          }}
        >
          {message}
        </div>
      ))}
    </div>
  );
}
