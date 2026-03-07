import { createInfoPanelStyle, createLogEntryStyle } from "./ui/styles";

export function EventLog({ log, isDesktop }) {
  return (
    <div style={createInfoPanelStyle({ maxHeight: isDesktop ? 220 : 90 })}>
      {log.map((message, index) => (
        <div
          key={`${index}-${message}`}
          style={createLogEntryStyle({ isLatest: index === 0, isDesktop })}
        >
          {message}
        </div>
      ))}
    </div>
  );
}
