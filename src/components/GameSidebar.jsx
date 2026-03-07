import { EventLog } from "./EventLog";
import { GuideCards } from "./GuideCards";
import { RoleBalancePanel } from "./RoleBalancePanel";

export function GameSidebar({ isDesktop, isBalanceModeEnabled, onToggleBalanceMode, roleMetrics, log }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <RoleBalancePanel
        isEnabled={isBalanceModeEnabled}
        onToggle={onToggleBalanceMode}
        roleMetrics={roleMetrics}
      />
      <EventLog log={log} isDesktop={isDesktop} />
      <GuideCards isDesktop={isDesktop} />
    </div>
  );
}
