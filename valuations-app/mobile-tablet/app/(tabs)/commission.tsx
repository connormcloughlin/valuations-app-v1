import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  ListRenderItem,
  Modal,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Button, Card, Chip, IconButton, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

import { useAuth } from '../../context/AuthContext';
import { colors, commissionStyles as s } from '../GlobalStyles';
import {
  assessmentCountLabel,
  currencyFormat,
  dateFormat,
  formatPeriodShortYYMM,
  formatPeriodYYMM,
} from '../../utils/formatting';
import { getCommissionPayroll } from '../../api/payroll';
import type { MobilePayrollLine, MobilePayrollResponse } from '../../types/payroll';
import { SkeletonLoader } from '../../components/LoadingStates';

const PHONE_BREAKPOINT = 600;

const SLA_CHIP = {
  success: colors.success,
  amber: '#FFBF00',
  critical: '#D32F2F',
} as const;

function yymmFromDate(d: Date): string {
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yy}${mm}`;
}

function shiftPeriodYYMM(period: string, deltaMonths: number): string {
  if (!/^\d{4}$/.test(period)) return yymmFromDate(new Date());
  const yy = Number(period.slice(0, 2));
  const mm = Number(period.slice(2, 4));
  const baseYear = 2000 + yy;
  const date = new Date(baseYear, mm - 1, 1);
  date.setMonth(date.getMonth() + deltaMonths);
  return yymmFromDate(date);
}

function parsePeriodParts(period: string): { year: number; month: number } {
  if (!/^\d{4}$/.test(period)) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  return { year: 2000 + Number(period.slice(0, 2)), month: Number(period.slice(2, 4)) };
}

function buildPeriodYYMM(year: number, month: number): string {
  const yy = String(year).slice(-2).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  return `${yy}${mm}`;
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function normalizeSurveyorGroup(payload: MobilePayrollResponse): {
  surveyorName?: string;
  lines: MobilePayrollLine[];
} {
  const group = payload.surveyor ?? payload.surveyors?.[0];
  return {
    surveyorName: group?.surveyorName,
    lines: group?.lines ?? [],
  };
}

function normStatus(v: string | null | undefined): string {
  return String(v ?? '').trim().toLowerCase();
}

function hasLineStatusMetadata(line: MobilePayrollLine): boolean {
  return (
    line.isReplaced != null ||
    line.riskAssessmentStatus != null ||
    line.status != null ||
    line.lineStatus != null ||
    line.assessmentStatus != null
  );
}

function isCompletedNotReplacedCommissionLine(line: MobilePayrollLine): boolean {
  if (line.isReplaced === true) return false;

  const statusValues = [
    line.riskAssessmentStatus,
    line.status,
    line.lineStatus,
    line.assessmentStatus,
  ]
    .map(normStatus)
    .filter((x) => x.length > 0);

  for (const status of statusValues) {
    if (status === 'replaced' || status.includes('replaced')) return false;
  }

  if (!hasLineStatusMetadata(line)) return true;

  const primary = statusValues[0] ?? '';
  if (!primary) return true;

  return primary === 'completed' || primary === 'complete';
}

function classifySlaMultiplier(m: number | null | undefined): '0' | '0.5' | '1' | 'unknown' {
  if (m == null || Number.isNaN(Number(m))) return 'unknown';
  const mult = Number(m);
  if (mult <= 0) return '0';
  if (Math.abs(mult - 0.5) < 0.001) return '0.5';
  if (Math.abs(mult - 1) < 0.001 || mult >= 1) return '1';
  if (mult < 0.5) return '0';
  return '0.5';
}

function slaAccessibilityLabel(multiplier: number | null | undefined): string {
  const tier = classifySlaMultiplier(multiplier);
  if (tier === '1') return 'SLA multiplier 1, full commission';
  if (tier === '0.5') return 'SLA multiplier 0.5, half commission';
  if (tier === '0') return 'SLA multiplier 0, no commission';
  return 'SLA multiplier unknown';
}

function SlaMultiplierChip({ multiplier }: { multiplier: number | null | undefined }) {
  const tier = classifySlaMultiplier(multiplier);
  const label =
    tier === 'unknown'
      ? 'SLA —'
      : tier === '0.5'
        ? 'SLA ×0.5'
        : tier === '1'
          ? 'SLA ×1'
          : 'SLA ×0';

  const bg =
    tier === '1'
      ? SLA_CHIP.success
      : tier === '0.5'
        ? SLA_CHIP.amber
        : tier === '0'
          ? SLA_CHIP.critical
          : colors.gray[300];

  const textColor =
    tier === '0.5' ? '#1a1a1a' : tier === 'unknown' ? colors.textPrimary : '#fff';

  return (
    <Chip
      compact
      mode="flat"
      style={[s.slaChip, { backgroundColor: bg }]}
      textStyle={[s.slaChipText, { color: textColor }]}
      accessibilityLabel={slaAccessibilityLabel(multiplier)}
    >
      {label}
    </Chip>
  );
}

function moneyClose(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.005;
}

function getCommissionReductionAmount(line: MobilePayrollLine): number | null {
  const raw = line as MobilePayrollLine & Record<string, unknown>;
  const directKeys = [
    'commissionReductionAmount',
    'commission_reduction_amount',
    'CommissionReductionAmount',
    'commReduction',
    'comm_reduction',
  ] as const;
  for (const key of directKeys) {
    const v = raw[key];
    if (v != null && v !== '') {
      const n = Number(v);
      if (Number.isFinite(n) && Math.abs(n) > 1e-9) return n;
    }
  }
  const orig = line.commissionAmountOriginal;
  const fin = line.commissionAmountFinal ?? line.commissionAmount;
  if (orig != null && fin != null) {
    const n = Number(orig) - Number(fin);
    if (Number.isFinite(n) && Math.abs(n) > 1e-9) return n;
  }
  return null;
}

function CommissionSkeleton({ isPhone }: { isPhone: boolean }) {
  return (
    <View style={[s.listContent, isPhone && s.listContentPhone]}>
      <Card style={[s.summaryBar, isPhone && s.summaryBarPhone]}>
        <Card.Content>
          <SkeletonLoader height={14} width="40%" />
          <View style={{ marginTop: 8 }}>
            <SkeletonLoader height={28} width="55%" />
          </View>
          <View style={{ marginTop: 8 }}>
            <SkeletonLoader height={12} width="35%" />
          </View>
        </Card.Content>
      </Card>
      {[1, 2].map((i) => (
        <Card key={i} style={[s.lineCardCompact, s.skeletonBlock]}>
          <Card.Content>
            <SkeletonLoader height={16} width="75%" />
            <View style={{ marginTop: 8 }}>
              <SkeletonLoader height={12} width="55%" />
            </View>
            <View style={{ marginTop: 12 }}>
              <SkeletonLoader height={48} />
            </View>
          </Card.Content>
        </Card>
      ))}
    </View>
  );
}

export default function CommissionScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isPhone = width < PHONE_BREAKPOINT;
  const isTablet = width >= PHONE_BREAKPOINT;

  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [period, setPeriod] = useState<string>(() => yymmFromDate(new Date()));
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(25);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<MobilePayrollResponse | null>(null);
  const [expandedLineId, setExpandedLineId] = useState<number | null>(null);
  const [periodPickerOpen, setPeriodPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(() => parsePeriodParts(yymmFromDate(new Date())).year);

  const summary = payload?.summary;
  const { surveyorName, lines } = useMemo(
    () => (payload ? normalizeSurveyorGroup(payload) : { surveyorName: undefined, lines: [] }),
    [payload]
  );

  const filteredLines = useMemo(() => lines.filter(isCompletedNotReplacedCommissionLine), [lines]);

  const displaySummary = useMemo(() => {
    if (!summary) return null;
    if (filteredLines.length === lines.length) return summary;
    const totalCommission = filteredLines.reduce(
      (acc, l) => acc + (l.commissionAmountFinal ?? l.commissionAmount ?? 0),
      0
    );
    const totalMileagePay = filteredLines.reduce((acc, l) => acc + (l.travelFee ?? 0), 0);
    const totalPayroll = filteredLines.reduce((acc, l) => acc + (l.totalPayrollAmount ?? 0), 0);
    return {
      ...summary,
      totalCommission,
      totalMileagePay,
      totalPayroll,
      assessmentCount: filteredLines.length,
    };
  }, [summary, lines.length, filteredLines]);

  useEffect(() => {
    if (expandedLineId == null) return;
    if (!filteredLines.some((l) => l.payrollLineId === expandedLineId)) {
      setExpandedLineId(null);
    }
  }, [filteredLines, expandedLineId]);

  const toggleLineExpanded = useCallback((lineId: number) => {
    setExpandedLineId((prev) => (prev === lineId ? null : lineId));
  }, []);

  const fetchData = async () => {
    if (!isAuthenticated) return;
    if (!/^\d{4}$/.test(period)) {
      setError('Period must be in YYMM format (e.g. 2501).');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await getCommissionPayroll({ period, page, pageSize });
      if (res?.success) {
        setPayload(res);
      } else {
        setPayload(null);
        setError(res?.message ?? 'Failed to load commission.');
      }
    } catch (e: any) {
      const msg =
        (typeof e?.response?.data?.message === 'string' && e.response.data.message) ||
        (typeof e?.message === 'string' && e.message) ||
        'Failed to load commission.';
      setPayload(null);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading, period, page]);

  const totalPages = payload?.pagination?.totalPages ?? 1;
  const currentPage = payload?.pagination?.page ?? page;
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;
  const showPagination = totalPages > 1;

  const shiftPeriod = (delta: number) => {
    setPeriod((p) => shiftPeriodYYMM(p, delta));
    setPage(1);
  };

  const openPeriodPicker = () => {
    setPickerYear(parsePeriodParts(period).year);
    setPeriodPickerOpen(true);
  };

  const selectPeriod = (year: number, month: number) => {
    setPeriod(buildPeriodYYMM(year, month));
    setPage(1);
    setPeriodPickerOpen(false);
  };

  const nowParts = parsePeriodParts(yymmFromDate(new Date()));
  const selectedParts = parsePeriodParts(period);
  const isFutureMonth = (year: number, month: number) =>
    year > nowParts.year || (year === nowParts.year && month > nowParts.month);

  const commissionTotal = displaySummary?.totalCommission ?? 0;
  const payrollTotal = displaySummary?.totalPayroll ?? 0;
  const commissionMatchesTotal = moneyClose(commissionTotal, payrollTotal);
  const assessmentCount = displaySummary?.assessmentCount ?? filteredLines.length;

  const renderInlineBreakdown = useCallback((item: MobilePayrollLine) => {
    const commissionShown = item.commissionAmountFinal ?? item.commissionAmount ?? 0;
    const red = getCommissionReductionAmount(item);
    const showReduction = red != null;
    return (
      <View style={s.inlineDetailPanel}>
        <View style={s.detailRow}>
          <Text style={s.detailLabel}>Base fee</Text>
          <Text style={s.detailValueMuted}>{currencyFormat(item.baseFee ?? 0)}</Text>
        </View>
        <View style={s.detailRow}>
          <Text style={s.detailLabel}>Commission %</Text>
          <Text style={s.detailValueMuted}>{(item.commissionPercent ?? 0).toFixed(2)}%</Text>
        </View>
        <View style={s.detailRowMulti}>
          <View style={s.detailRowLeft}>
            <Text style={s.detailLabelEmphasis}>Commission</Text>
            <Text style={s.detailValueEmphasis}>{currencyFormat(commissionShown)}</Text>
          </View>
          <View style={s.detailSlaWrap}>
            <SlaMultiplierChip multiplier={item.slaCommissionMultiplier} />
          </View>
        </View>
        {item.commissionAmountOriginal != null && (
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Commission (original)</Text>
            <Text style={s.detailValueMuted}>{currencyFormat(item.commissionAmountOriginal)}</Text>
          </View>
        )}
        {showReduction && (
          <View style={s.detailRow}>
            <Text style={s.detailLabelEmphasis}>Reduction</Text>
            <Text style={[s.detailValueEmphasis, s.reductionValue]}>{currencyFormat(red!)}</Text>
          </View>
        )}
        {item.slaDaysOver != null && (
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>SLA days over</Text>
            <Text style={s.detailValueMuted}>{String(item.slaDaysOver)}</Text>
          </View>
        )}
        <View style={s.detailRow}>
          <Text style={s.detailLabelEmphasis}>Km</Text>
          <Text style={s.detailValueEmphasis}>{(item.totalMileageKm ?? 0).toFixed(0)} km</Text>
        </View>
        <View style={[s.detailRow, s.detailRowLast]}>
          <Text style={s.detailLabelEmphasis}>Travel</Text>
          <Text style={s.detailValueEmphasis}>{currencyFormat(item.travelFee ?? 0)}</Text>
        </View>
      </View>
    );
  }, []);

  const renderCommissionLine: ListRenderItem<MobilePayrollLine> = useCallback(
    ({ item }) => {
      const expanded = expandedLineId === item.payrollLineId;
      const commissionShown = item.commissionAmountFinal ?? item.commissionAmount ?? 0;
      const title = item.assessmentNo ?? `Assessment #${item.riskAssessmentId}`;
      const red = getCommissionReductionAmount(item);
      const showReduction = red != null;

      return (
        <Card
          style={[s.lineCardCompact, expanded && s.lineCardExpanded]}
          mode="outlined"
        >
          <Pressable
            onPress={() => toggleLineExpanded(item.payrollLineId)}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityHint={expanded ? 'Collapse commission breakdown' : 'Expand commission breakdown'}
          >
            <Card.Content style={s.lineCardContent}>
              <View style={s.lineTopRow}>
                <Text style={s.lineTitleCompact} numberOfLines={1}>
                  {title}
                </Text>
                <View style={s.lineTopMeta}>
                  <Text style={s.lineEarned}>{currencyFormat(item.totalPayrollAmount ?? 0)}</Text>
                  <MaterialCommunityIcons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={colors.textSecondary}
                  />
                </View>
              </View>
              <Text style={s.lineClientDate} numberOfLines={1}>
                {item.clientName ?? 'Unknown client'} · {dateFormat(item.surveyDate)}
              </Text>
              <Text style={s.baseFeeRow}>
                Base {currencyFormat(item.baseFee ?? 0)} · {(item.commissionPercent ?? 0).toFixed(1)}%
              </Text>

              <View style={s.metricGrid}>
                <View style={s.metricCell}>
                  <Text style={s.metricCellLabel}>Comm</Text>
                  <Text style={s.metricCellValue} numberOfLines={1}>
                    {currencyFormat(commissionShown)}
                  </Text>
                </View>
                <View style={s.metricCell}>
                  <Text style={s.metricCellLabel}>Travel</Text>
                  <Text style={s.metricCellValue} numberOfLines={1}>
                    {currencyFormat(item.travelFee ?? 0)}
                  </Text>
                </View>
                <View style={s.metricCell}>
                  <Text style={s.metricCellLabel}>Km</Text>
                  <Text style={s.metricCellValue}>{(item.totalMileageKm ?? 0).toFixed(0)}</Text>
                </View>
              </View>

              <View style={s.slaRow}>
                {showReduction ? (
                  <Text style={s.reducedInline} numberOfLines={1}>
                    Reduced {currencyFormat(red!)}
                  </Text>
                ) : (
                  <View style={{ flex: 1 }} />
                )}
                <SlaMultiplierChip multiplier={item.slaCommissionMultiplier} />
              </View>
            </Card.Content>
          </Pressable>
          {expanded ? renderInlineBreakdown(item) : null}
        </Card>
      );
    },
    [expandedLineId, renderInlineBreakdown, toggleLineExpanded]
  );

  const filteredEmptyMessage =
    lines.length > 0 && filteredLines.length === 0 ? (
      <View style={s.center}>
        <MaterialCommunityIcons name="filter-remove-outline" size={56} color={colors.gray[400]} />
        <Text style={s.infoText}>
          No completed commission lines for this view. Replaced or non-completed assessments are hidden.
        </Text>
      </View>
    ) : null;

  const summaryBlock =
    displaySummary != null ? (
      <Card style={[s.summaryBar, isPhone && s.summaryBarPhone]} mode="elevated">
        <Card.Content style={s.summaryBarContent}>
          {isTablet && !commissionMatchesTotal ? (
            <View style={s.summaryStrip}>
              <View style={s.summaryStripCell}>
                <Text style={s.summaryBarLabel}>Commission</Text>
                <Text style={s.summaryBarValue}>{currencyFormat(commissionTotal)}</Text>
              </View>
              <View style={s.summaryStripCell}>
                <Text style={s.summaryBarLabel}>Mileage</Text>
                <Text style={s.summaryBarValue}>
                  {currencyFormat(displaySummary.totalMileagePay ?? 0)}
                </Text>
              </View>
              <View style={s.summaryStripCell}>
                <Text style={s.summaryBarLabel}>Total</Text>
                <Text style={s.summaryBarValue}>{currencyFormat(payrollTotal)}</Text>
              </View>
              <View style={[s.summaryStripCell, s.summaryStripCellLast]}>
                <Text style={s.summaryBarLabel}>Assessments</Text>
                <Text style={s.summaryBarValue}>{assessmentCount}</Text>
              </View>
            </View>
          ) : commissionMatchesTotal ? (
            <View style={s.summarySingle}>
              <Text style={s.summarySingleLabel}>Total earnings</Text>
              <Text style={[s.summarySingleValue, { color: theme.colors.primary }]}>
                {currencyFormat(commissionTotal)}
              </Text>
              <Text style={s.summarySingleContext}>
                {assessmentCountLabel(assessmentCount)} · {formatPeriodShortYYMM(period)}
              </Text>
            </View>
          ) : (
            <View style={s.summaryGrid}>
              <View style={s.summaryCell}>
                <Text style={s.summaryBarLabel}>Commission</Text>
                <Text style={s.summaryBarValue}>{currencyFormat(commissionTotal)}</Text>
              </View>
              <View style={s.summaryCell}>
                <Text style={s.summaryBarLabel}>Mileage</Text>
                <Text style={s.summaryBarValue}>
                  {currencyFormat(displaySummary.totalMileagePay ?? 0)}
                </Text>
              </View>
              <View style={s.summaryCell}>
                <Text style={s.summaryBarLabel}>Total</Text>
                <Text style={s.summaryBarValue}>{currencyFormat(payrollTotal)}</Text>
              </View>
              <View style={s.summaryCell}>
                <Text style={s.summaryBarLabel}>Assessments</Text>
                <Text style={s.summaryBarValue}>{assessmentCount}</Text>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    ) : null;

  const listSection =
    !displaySummary || !payload ? null : filteredLines.length === 0 ? (
      <View style={s.listEmptyWrap}>
        {filteredEmptyMessage ?? (
          <View style={s.center}>
            <Text style={s.infoText}>No rows for this period.</Text>
            <Button mode="outlined" icon="chevron-left" onPress={() => shiftPeriod(-1)}>
              Try previous month
            </Button>
          </View>
        )}
      </View>
    ) : (
      <FlatList
        style={s.flexOne}
        data={filteredLines}
        renderItem={renderCommissionLine}
        keyExtractor={(item) => `payroll-${item.payrollLineId}`}
        contentContainerStyle={[s.listContent, isPhone && s.listContentPhone]}
        onRefresh={fetchData}
        refreshing={loading && !!payload}
        initialNumToRender={isTablet ? 12 : 8}
        windowSize={isTablet ? 7 : 5}
      />
    );

  const phonePeriodControls = (
    <View style={s.periodRow}>
      <IconButton
        icon="chevron-left"
        mode="outlined"
        size={22}
        onPress={() => shiftPeriod(-1)}
        disabled={loading}
        style={s.periodNavButton}
        accessibilityLabel="Previous month"
      />
      <Pressable
        style={s.periodLabelWrap}
        onPress={openPeriodPicker}
        disabled={loading}
        accessibilityRole="button"
        accessibilityHint="Choose a specific month"
      >
        <View style={s.periodLabelButton}>
          <Text style={s.periodLabel}>{formatPeriodYYMM(period)}</Text>
          <MaterialCommunityIcons name="menu-down" size={20} color={colors.textSecondary} />
        </View>
        <Text style={s.periodHint}>{period}</Text>
      </Pressable>
      <IconButton
        icon="chevron-right"
        mode="outlined"
        size={22}
        onPress={() => shiftPeriod(1)}
        disabled={loading}
        style={s.periodNavButton}
        accessibilityLabel="Next month"
      />
    </View>
  );

  const tabletToolbar = (
    <View style={s.toolbarRow}>
      <View style={s.toolbarTitleBlock}>
        <Text style={s.title}>My Commission</Text>
        {surveyorName ? (
          <Text style={s.subtitle} numberOfLines={1}>
            {surveyorName}
          </Text>
        ) : null}
      </View>
      <View style={s.periodGroupInline}>
        <Button
          mode="outlined"
          onPress={() => shiftPeriod(-1)}
          disabled={loading}
          icon="chevron-left"
          compact
        >
          Prev
        </Button>
        <Pressable
          style={s.periodLabelWrapInline}
          onPress={openPeriodPicker}
          disabled={loading}
          accessibilityRole="button"
          accessibilityHint="Choose a specific month"
        >
          <View style={s.periodLabelButton}>
            <Text style={s.periodLabel}>{formatPeriodYYMM(period)}</Text>
            <MaterialCommunityIcons name="menu-down" size={20} color={colors.textSecondary} />
          </View>
          <Text style={s.periodHint}>{period}</Text>
        </Pressable>
        <Button
          mode="outlined"
          onPress={() => shiftPeriod(1)}
          disabled={loading}
          icon="chevron-right"
          contentStyle={{ flexDirection: 'row-reverse' }}
          compact
        >
          Next
        </Button>
      </View>
      <IconButton
        icon="refresh"
        mode="outlined"
        size={22}
        onPress={fetchData}
        disabled={loading}
        accessibilityLabel="Refresh commission"
      />
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'My Commission', headerTitleStyle: { fontWeight: '600' } }} />

      <View style={s.container}>
        {!isAuthenticated || !user ? (
          <View style={s.center}>
            <Text style={s.infoText}>Sign in to view your commission.</Text>
          </View>
        ) : (
          <View style={[s.authenticatedBody, s.contentWrap]}>
            <Card style={[s.controlsCard, isPhone && s.controlsCardPhone]}>
              <Card.Content>
                {isPhone ? (
                  <>
                    <View style={s.controlsHeader}>
                      <View style={{ flex: 1 }}>
                        {surveyorName ? (
                          <Text style={s.subtitle} numberOfLines={1}>
                            {surveyorName}
                          </Text>
                        ) : (
                          <Text style={s.subtitle}>Commission period</Text>
                        )}
                      </View>
                      <IconButton
                        icon="refresh"
                        mode="outlined"
                        size={22}
                        onPress={fetchData}
                        disabled={loading}
                        accessibilityLabel="Refresh commission"
                      />
                    </View>
                    {phonePeriodControls}
                  </>
                ) : (
                  tabletToolbar
                )}
              </Card.Content>
            </Card>

            {loading && !payload ? (
              <CommissionSkeleton isPhone={isPhone} />
            ) : error ? (
              <View style={s.center}>
                <MaterialCommunityIcons name="alert-circle-outline" size={44} color={colors.error} />
                <Text style={s.errorText}>{error}</Text>
                <Button mode="contained" onPress={fetchData} buttonColor={colors.primary}>
                  Retry
                </Button>
              </View>
            ) : !payload || !summary ? (
              <View style={s.center}>
                <MaterialCommunityIcons name="cash-remove" size={64} color={colors.gray[400]} />
                <Text style={s.infoText}>No commission has been generated for this period yet.</Text>
                <Button mode="outlined" icon="chevron-left" onPress={() => shiftPeriod(-1)}>
                  Try previous month
                </Button>
              </View>
            ) : (
              <View style={s.mainColumn}>
                {summaryBlock}
                <View style={s.listFlex}>{listSection}</View>

                {showPagination ? (
                  <View style={[s.paginationRow, isPhone && s.paginationRowPhone]}>
                    {isPhone ? (
                      <>
                        <IconButton
                          icon="chevron-left"
                          mode="outlined"
                          size={20}
                          onPress={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={loading || !canPrev}
                          accessibilityLabel="Previous page"
                        />
                        <Text style={s.pageText}>
                          {currentPage} / {totalPages}
                        </Text>
                        <IconButton
                          icon="chevron-right"
                          mode="outlined"
                          size={20}
                          onPress={() => setPage((p) => p + 1)}
                          disabled={loading || !canNext}
                          accessibilityLabel="Next page"
                        />
                      </>
                    ) : (
                      <>
                        <Button
                          mode="outlined"
                          onPress={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={loading || !canPrev}
                          compact
                        >
                          Previous
                        </Button>
                        <Text style={s.pageText}>
                          Page {currentPage} of {totalPages}
                        </Text>
                        <Button
                          mode="outlined"
                          onPress={() => setPage((p) => p + 1)}
                          disabled={loading || !canNext}
                          compact
                        >
                          Next
                        </Button>
                      </>
                    )}
                  </View>
                ) : null}
              </View>
            )}
          </View>
        )}
      </View>

      <Modal
        visible={periodPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPeriodPickerOpen(false)}
      >
        <Pressable style={s.pickerBackdrop} onPress={() => setPeriodPickerOpen(false)}>
          <Pressable style={s.pickerCard} onPress={(e) => e.stopPropagation()}>
            <Text style={s.pickerTitle}>Select period</Text>
            <View style={s.pickerYearRow}>
              <IconButton
                icon="chevron-left"
                mode="outlined"
                size={22}
                onPress={() => setPickerYear((y) => y - 1)}
                accessibilityLabel="Previous year"
              />
              <Text style={s.pickerYearText}>{pickerYear}</Text>
              <IconButton
                icon="chevron-right"
                mode="outlined"
                size={22}
                onPress={() => setPickerYear((y) => y + 1)}
                disabled={pickerYear >= nowParts.year}
                accessibilityLabel="Next year"
              />
            </View>
            <View style={s.monthGrid}>
              {MONTH_LABELS.map((label, idx) => {
                const month = idx + 1;
                const selected = pickerYear === selectedParts.year && month === selectedParts.month;
                const disabled = isFutureMonth(pickerYear, month);
                return (
                  <Pressable
                    key={label}
                    style={[
                      s.monthCell,
                      selected && s.monthCellSelected,
                      disabled && s.monthCellDisabled,
                    ]}
                    onPress={() => selectPeriod(pickerYear, month)}
                    disabled={disabled}
                    accessibilityRole="button"
                    accessibilityState={{ selected, disabled }}
                    accessibilityLabel={`${label} ${pickerYear}`}
                  >
                    <Text style={[s.monthCellText, selected && s.monthCellTextSelected]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={s.pickerActions}>
              <Button mode="text" onPress={() => selectPeriod(nowParts.year, nowParts.month)}>
                This month
              </Button>
              <Button mode="contained" onPress={() => setPeriodPickerOpen(false)} buttonColor={colors.primary}>
                Close
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
