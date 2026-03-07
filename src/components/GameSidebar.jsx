import { EventLog } from "./EventLog";
import { GuideCards } from "./GuideCards";
import { RoleBalancePanel } from "./RoleBalancePanel";
import { stackedSidebarStyle } from "./ui/styles";

export function GameSidebar({ isDesktop, isBalanceModeEnabled, onToggleBalanceMode, roleMetrics, log }) {
  return (
    <div style={stackedSidebarStyle}>
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
