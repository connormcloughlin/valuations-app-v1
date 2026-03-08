/**
 * SLA status labels and colours for surveyor segment and full SLA.
 * Used by SlaStatusBadge, SurveyorSlaCard, FullSlaCard.
 */

export type SurveyorSlaStatus = 'on_track' | 'at_risk' | 'breached' | 'met' | null;
export type FullSlaStatus = 'pending' | 'on_track' | 'at_risk' | 'breached' | 'met' | null;

export const SLA_STATUS_LABELS: Record<string, string> = {
  on_track: 'On track',
  at_risk: 'At risk',
  breached: 'Breached',
  met: 'Met',
  pending: 'Pending'
};

export const SLA_STATUS_COLORS: Record<string, string> = {
  on_track: '#27ae60',   // green - success
  met: '#27ae60',        // green
  at_risk: '#f39c12',    // amber - warning
  breached: '#e74c3c',   // red - error
  pending: '#95a5a6'     // grey
};

export function getSlaStatusLabel(status: string | null | undefined): string {
  if (status == null || status === '') return 'Pending';
  return SLA_STATUS_LABELS[status] ?? status;
}

export function getSlaStatusColor(status: string | null | undefined): string {
  if (status == null || status === '') return SLA_STATUS_COLORS.pending;
  return SLA_STATUS_COLORS[status] ?? SLA_STATUS_COLORS.pending;
}
