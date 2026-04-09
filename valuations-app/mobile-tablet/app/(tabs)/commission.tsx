import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { Button, Card, Chip, TextInput, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

import { useAuth } from '../../context/AuthContext';
import { colors } from '../GlobalStyles';
import { currencyFormat, dateFormat } from '../../utils/formatting';
import { getCommissionPayroll } from '../../api/payroll';
import type { MobilePayrollLine, MobilePayrollResponse } from '../../types/payroll';

/** Spec: SLA multiplier chip colours */
const SLA_CHIP = {
  success: colors.success,
  amber: '#FFBF00',
  critical: '#D32F2F'
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

function normalizeSurveyorGroup(payload: MobilePayrollResponse): {
  surveyorName?: string;
  lines: MobilePayrollLine[];
} {
  const group = payload.surveyor ?? payload.surveyors?.[0];
  return {
    surveyorName: group?.surveyorName,
    lines: group?.lines ?? []
  };
}

function normStatus(s: string | null | undefined): string {
  return String(s ?? '')
    .trim()
    .toLowerCase();
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
  if (line.isReplaced === true) {
    return false;
  }

  const statusValues = [
    line.riskAssessmentStatus,
    line.status,
    line.lineStatus,
    line.assessmentStatus
  ]
    .map(normStatus)
    .filter((s) => s.length > 0);

  for (const s of statusValues) {
    if (s === 'replaced' || s.includes('replaced')) {
      return false;
    }
  }

  if (!hasLineStatusMetadata(line)) {
    return true;
  }

  const primary = statusValues[0] ?? '';
  if (!primary) {
    return true;
  }

  return primary === 'completed' || primary === 'complete';
}

function classifySlaMultiplier(m: number | null | undefined): '0' | '0.5' | '1' | 'unknown' {
  if (m == null || Number.isNaN(Number(m))) {
    return 'unknown';
  }
  const mult = Number(m);
  if (mult <= 0) {
    return '0';
  }
  if (Math.abs(mult - 0.5) < 0.001) {
    return '0.5';
  }
  if (Math.abs(mult - 1) < 0.001 || mult >= 1) {
    return '1';
  }
  if (mult < 0.5) {
    return '0';
  }
  return '0.5';
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
      style={[styles.slaChip, { backgroundColor: bg }]}
      textStyle={[styles.slaChipText, { color: textColor }]}
    >
      {label}
    </Chip>
  );
}

function moneyClose(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.005;
}

/** Backend may send camelCase, snake_case, or omit in favour of original vs final commission. */
function getCommissionReductionAmount(line: MobilePayrollLine): number | null {
  const raw = line as MobilePayrollLine & Record<string, unknown>;
  const directKeys = [
    'commissionReductionAmount',
    'commission_reduction_amount',
    'CommissionReductionAmount',
    'commReduction',
    'comm_reduction'
  ] as const;
  for (const key of directKeys) {
    const v = raw[key];
    if (v != null && v !== '') {
      const n = Number(v);
      if (Number.isFinite(n) && Math.abs(n) > 1e-9) {
        return n;
      }
    }
  }
  const orig = line.commissionAmountOriginal;
  const fin = line.commissionAmountFinal ?? line.commissionAmount;
  if (orig != null && fin != null) {
    const n = Number(orig) - Number(fin);
    if (Number.isFinite(n) && Math.abs(n) > 1e-9) {
      return n;
    }
  }
  return null;
}

export default function CommissionScreen() {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [period, setPeriod] = useState<string>(() => yymmFromDate(new Date()));
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(25);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<MobilePayrollResponse | null>(null);
  const [selectedLine, setSelectedLine] = useState<MobilePayrollLine | null>(null);

  const summary = payload?.summary;
  const { surveyorName, lines } = useMemo(
    () => (payload ? normalizeSurveyorGroup(payload) : { surveyorName: undefined, lines: [] }),
    [payload]
  );

  const filteredLines = useMemo(() => lines.filter(isCompletedNotReplacedCommissionLine), [lines]);

  const displaySummary = useMemo(() => {
    if (!summary) return null;
    if (filteredLines.length === lines.length) {
      return summary;
    }
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
      assessmentCount: filteredLines.length
    };
  }, [summary, lines.length, filteredLines]);

  useEffect(() => {
    if (filteredLines.length === 0) {
      setSelectedLine(null);
      return;
    }
    setSelectedLine((prev) => {
      if (prev && filteredLines.some((l) => l.payrollLineId === prev.payrollLineId)) {
        return prev;
      }
      return filteredLines[0];
    });
  }, [filteredLines]);

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

  const canPrev = (payload?.pagination?.page ?? page) > 1;
  const canNext = (payload?.pagination?.page ?? page) < (payload?.pagination?.totalPages ?? 1);

  const onChangePeriodText = (text: string) => {
    const cleaned = text.replace(/[^\d]/g, '').slice(0, 4);
    setPeriod(cleaned);
    setPage(1);
  };

  const commissionTotal = displaySummary?.totalCommission ?? 0;
  const payrollTotal = displaySummary?.totalPayroll ?? 0;
  const commissionMatchesTotal = moneyClose(commissionTotal, payrollTotal);

  const renderDetailBreakdown = useCallback((item: MobilePayrollLine) => {
    const commissionShown = item.commissionAmountFinal ?? item.commissionAmount ?? 0;
    const red = getCommissionReductionAmount(item);
    const showReduction = red != null;
    return (
      <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailScrollContent}>
        <Text style={styles.detailTitle}>
          {item.assessmentNo ?? `Assessment #${item.riskAssessmentId}`}
        </Text>
        <Text style={styles.detailSubtitle}>{item.clientName ?? 'Unknown client'}</Text>
        <Text style={styles.detailMeta}>Surveyed {dateFormat(item.surveyDate)}</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabelEmphasis}>Total earned</Text>
          <Text style={styles.detailValueEmphasis}>{currencyFormat(item.totalPayrollAmount ?? 0)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Base fee</Text>
          <Text style={styles.detailValueMuted}>{currencyFormat(item.baseFee ?? 0)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Commission %</Text>
          <Text style={styles.detailValueMuted}>{(item.commissionPercent ?? 0).toFixed(2)}%</Text>
        </View>
        <View style={styles.detailRowMulti}>
          <View style={styles.detailRowLeft}>
            <Text style={styles.detailLabelEmphasis}>Commission</Text>
            <Text style={styles.detailValueEmphasis}>{currencyFormat(commissionShown)}</Text>
          </View>
          <View style={styles.detailSlaWrap}>
            <SlaMultiplierChip multiplier={item.slaCommissionMultiplier} />
          </View>
        </View>
        {item.commissionAmountOriginal != null && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Commission (original)</Text>
            <Text style={styles.detailValueMuted}>{currencyFormat(item.commissionAmountOriginal)}</Text>
          </View>
        )}
        {showReduction && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabelEmphasis}>Reduction</Text>
            <Text style={styles.detailValueEmphasis}>{currencyFormat(red!)}</Text>
          </View>
        )}
        {item.slaDaysOver != null && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>SLA days over</Text>
            <Text style={styles.detailValueMuted}>{String(item.slaDaysOver)}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabelEmphasis}>Km</Text>
          <Text style={styles.detailValueEmphasis}>
            {(item.totalMileageKm ?? 0).toFixed(0)} km
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabelEmphasis}>Travel</Text>
          <Text style={styles.detailValueEmphasis}>{currencyFormat(item.travelFee ?? 0)}</Text>
        </View>
      </ScrollView>
    );
  }, []);

  const renderPortraitLine: ListRenderItem<MobilePayrollLine> = useCallback(
    ({ item }) => {
      const commissionShown = item.commissionAmountFinal ?? item.commissionAmount ?? 0;
      const title = item.assessmentNo ?? `Assessment #${item.riskAssessmentId}`;
      const red = getCommissionReductionAmount(item);
      const showReduction = red != null;
      return (
        <Card style={styles.lineCardCompact} mode="outlined">
          <Card.Content style={styles.lineCardContent}>
            <View style={styles.lineTopRow}>
              <Text style={styles.lineTitleCompact} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.lineEarned}>{currencyFormat(item.totalPayrollAmount ?? 0)}</Text>
            </View>
            <Text style={styles.lineClientDate} numberOfLines={1}>
              {item.clientName ?? 'Unknown client'} · {dateFormat(item.surveyDate)}
            </Text>
            <Text style={styles.baseFeeRow}>
              Base {currencyFormat(item.baseFee ?? 0)} · {(item.commissionPercent ?? 0).toFixed(1)}%
            </Text>

            <View style={styles.metricsOneRow}>
              <View style={styles.metricsLeftCluster}>
                <Text style={styles.metricSegment}>
                  <Text style={styles.metricLabel}>Comm </Text>
                  <Text style={styles.metricValue}>{currencyFormat(commissionShown)}</Text>
                </Text>
                <Text style={styles.metricDot}>·</Text>
                <Text style={styles.metricSegment}>
                  <Text style={styles.metricLabel}>Travel </Text>
                  <Text style={styles.metricValue}>{currencyFormat(item.travelFee ?? 0)}</Text>
                </Text>
                <Text style={styles.metricDot}>·</Text>
                <Text style={styles.metricSegment}>
                  <Text style={styles.metricValue}>{(item.totalMileageKm ?? 0).toFixed(0)} km</Text>
                </Text>
                {showReduction && (
                  <>
                    <Text style={styles.metricDot}>·</Text>
                    <Text style={styles.metricSegment}>
                      <Text style={styles.reducedLabel}>Reduced </Text>
                      <Text style={styles.reducedValue}>{currencyFormat(red!)}</Text>
                    </Text>
                  </>
                )}
              </View>
              <View style={styles.metricsSlaRight}>
                <SlaMultiplierChip multiplier={item.slaCommissionMultiplier} />
              </View>
            </View>
          </Card.Content>
        </Card>
      );
    },
    []
  );

  const renderLandscapeRow: ListRenderItem<MobilePayrollLine> = useCallback(
    ({ item }) => {
      const selected = selectedLine?.payrollLineId === item.payrollLineId;
      const title = item.assessmentNo ?? `#${item.riskAssessmentId}`;
      return (
        <Pressable
          onPress={() => setSelectedLine(item)}
          style={[styles.landRow, selected && styles.landRowSelected]}
        >
          <Text style={styles.landTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.landDate}>{dateFormat(item.surveyDate)}</Text>
          <Text style={styles.landAmount}>{currencyFormat(item.totalPayrollAmount ?? 0)}</Text>
        </Pressable>
      );
    },
    [selectedLine]
  );

  const filteredEmptyMessage =
    lines.length > 0 && filteredLines.length === 0 ? (
      <View style={styles.center}>
        <MaterialCommunityIcons name="filter-remove-outline" size={56} color={colors.gray[400]} />
        <Text style={styles.infoText}>
          No completed commission lines for this view. Replaced or non-completed assessments are hidden.
        </Text>
      </View>
    ) : null;

  const summaryBlock =
    displaySummary != null ? (
      <Card style={styles.summaryBar} mode="elevated">
        <Card.Content style={styles.summaryBarContent}>
          {commissionMatchesTotal ? (
            <View style={styles.summarySingle}>
              <Text style={styles.summarySingleLabel}>Total earnings</Text>
              <View style={styles.summarySingleRow}>
                <Text style={[styles.summarySingleValue, { color: theme.colors.primary }]}>
                  {currencyFormat(commissionTotal)}
                </Text>
                <Text style={styles.summarySingleCount}>
                  {displaySummary.assessmentCount ?? filteredLines.length} assessments
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryBarLabel}>Commission</Text>
                <Text style={styles.summaryBarValue}>{currencyFormat(commissionTotal)}</Text>
              </View>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryBarLabel}>Mileage</Text>
                <Text style={styles.summaryBarValue}>
                  {currencyFormat(displaySummary.totalMileagePay ?? 0)}
                </Text>
              </View>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryBarLabel}>Total</Text>
                <Text style={styles.summaryBarValue}>{currencyFormat(payrollTotal)}</Text>
              </View>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryBarLabel}>Assessments</Text>
                <Text style={styles.summaryBarValue}>
                  {displaySummary.assessmentCount ?? filteredLines.length}
                </Text>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    ) : null;

  const listSection =
    !displaySummary || !payload ? null : filteredLines.length === 0 ? (
      <View style={styles.listEmptyWrap}>
        {filteredEmptyMessage ?? (
          <View style={styles.center}>
            <Text style={styles.infoText}>No rows for this period.</Text>
          </View>
        )}
      </View>
    ) : isLandscape ? (
      <View style={styles.landRoot}>
        <View style={styles.landListPane}>
          <FlatList
            style={styles.flexOne}
            data={filteredLines}
            renderItem={renderLandscapeRow}
            keyExtractor={(item) => `payroll-${item.payrollLineId}`}
            contentContainerStyle={styles.landListContent}
            onRefresh={fetchData}
            refreshing={loading}
            initialNumToRender={12}
            windowSize={5}
          />
        </View>
        <View style={styles.landDetailPane}>
          {selectedLine ? (
            renderDetailBreakdown(selectedLine)
          ) : (
            <View style={styles.center}>
              <Text style={styles.infoText}>Select an assessment</Text>
            </View>
          )}
        </View>
      </View>
    ) : (
      <FlatList
        style={styles.flexOne}
        data={filteredLines}
        renderItem={renderPortraitLine}
        keyExtractor={(item) => `payroll-${item.payrollLineId}`}
        contentContainerStyle={styles.listContent}
        onRefresh={fetchData}
        refreshing={loading}
        initialNumToRender={8}
        windowSize={7}
      />
    );

  return (
    <>
      <Stack.Screen options={{ title: 'My Commission', headerTitleStyle: { fontWeight: '600' } }} />

      <View style={styles.container}>
        {!isAuthenticated || !user ? (
          <View style={styles.center}>
            <Text style={styles.infoText}>Sign in to view your commission.</Text>
          </View>
        ) : (
          <View style={styles.authenticatedBody}>
            <Card style={styles.controlsCard}>
              <Card.Content>
                <View style={styles.controlsHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>My Commission</Text>
                    {surveyorName ? (
                      <Text style={styles.subtitle} numberOfLines={1}>
                        {surveyorName}
                      </Text>
                    ) : null}
                  </View>
                  <Button
                    mode="outlined"
                    onPress={fetchData}
                    disabled={loading}
                    icon="refresh"
                  >
                    Refresh
                  </Button>
                </View>

                <View style={styles.periodRow}>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setPeriod((p) => shiftPeriodYYMM(p, -1));
                      setPage(1);
                    }}
                    disabled={loading}
                    icon="chevron-left"
                  >
                    Prev
                  </Button>

                  <TextInput
                    label="Period (YYMM)"
                    value={period}
                    onChangeText={onChangePeriodText}
                    mode="outlined"
                    keyboardType="number-pad"
                    style={styles.periodInput}
                    maxLength={4}
                    disabled={loading}
                  />

                  <Button
                    mode="outlined"
                    onPress={() => {
                      setPeriod((p) => shiftPeriodYYMM(p, 1));
                      setPage(1);
                    }}
                    disabled={loading}
                    icon="chevron-right"
                    contentStyle={{ flexDirection: 'row-reverse' }}
                  >
                    Next
                  </Button>
                </View>
              </Card.Content>
            </Card>

            {loading && !payload ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.infoText}>Loading commission...</Text>
              </View>
            ) : error ? (
              <View style={styles.center}>
                <MaterialCommunityIcons name="alert-circle-outline" size={44} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
                <Button mode="contained" onPress={fetchData} buttonColor={colors.primary}>
                  Retry
                </Button>
              </View>
            ) : !payload || !summary ? (
              <View style={styles.center}>
                <MaterialCommunityIcons name="cash-remove" size={64} color={colors.gray[400]} />
                <Text style={styles.infoText}>No commission has been generated for this period yet.</Text>
              </View>
            ) : (
              <View style={styles.mainColumn}>
                {summaryBlock}
                <View style={styles.listFlex}>{listSection}</View>

                <View style={styles.paginationRow}>
                  <Button
                    mode="outlined"
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={loading || !canPrev}
                  >
                    Previous
                  </Button>
                  <Text style={styles.pageText}>
                    Page {payload.pagination?.page ?? page} of {payload.pagination?.totalPages ?? 1}
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={() => setPage((p) => p + 1)}
                    disabled={loading || !canNext}
                  >
                    Next
                  </Button>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  /** Fills space above tab bar so period card + list column layout stays predictable */
  authenticatedBody: {
    flex: 1,
    minHeight: 0
  },
  mainColumn: {
    flex: 1,
    minHeight: 0
  },
  listFlex: {
    flex: 1,
    minHeight: 0
  },
  listEmptyWrap: {
    flex: 1,
    minHeight: 0,
    justifyContent: 'center'
  },
  flexOne: {
    flex: 1
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 12
  },
  controlsCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12
  },
  controlsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  periodInput: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    minHeight: 48
  },
  summaryBar: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: colors.cardBackground
  },
  summaryBarContent: {
    paddingVertical: 8,
    paddingHorizontal: 4
  },
  summarySingle: {
    alignItems: 'center',
    paddingVertical: 4
  },
  summarySingleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4
  },
  summarySingleLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  summarySingleValue: {
    fontSize: 22,
    fontWeight: '800'
  },
  summarySingleCount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  summaryCell: {
    width: '47%',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: colors.gray[50],
    borderRadius: 8
  },
  summaryBarLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase'
  },
  summaryBarValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  lineCardCompact: {
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: colors.cardBackground
  },
  lineCardContent: {
    paddingVertical: 8,
    paddingHorizontal: 10
  },
  lineTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2
  },
  lineTitleCompact: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  lineEarned: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  lineClientDate: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4
  },
  /** Base + % — same weight as former “Comm” label line (muted) */
  baseFeeRow: {
    fontSize: 10,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 6
  },
  metricsOneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2
  },
  metricsLeftCluster: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 6,
    rowGap: 4,
    minWidth: 0
  },
  metricsSlaRight: {
    flexShrink: 0
  },
  metricSegment: {
    flexShrink: 0
  },
  reducedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.error
  },
  reducedValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.error
  },
  metricDot: {
    fontSize: 10,
    color: colors.textSecondary,
    marginHorizontal: 2
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary
  },
  metricValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary
  },
  slaChip: {
    height: 28,
    marginVertical: 0
  },
  slaChipText: {
    fontSize: 11,
    fontWeight: '700',
    marginVertical: 0
  },
  landRoot: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0
  },
  landListPane: {
    width: '33%',
    minWidth: 140,
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
    backgroundColor: colors.cardBackground
  },
  landListContent: {
    paddingBottom: 16
  },
  landRow: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  landRowSelected: {
    backgroundColor: colors.statusInfo
  },
  landTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2
  },
  landDate: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 2
  },
  landAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary
  },
  landDetailPane: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.background
  },
  detailScroll: {
    flex: 1
  },
  detailScrollContent: {
    padding: 16,
    paddingBottom: 24
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4
  },
  detailSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4
  },
  detailMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 16
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary
  },
  /** Bold labels for priority metrics (matches portrait Comm / Travel / Km) */
  detailLabelEmphasis: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary
  },
  detailValueEmphasis: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  detailValueMuted: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary
  },
  detailRowMulti: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight
  },
  detailRowLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  detailSlaWrap: {
    flexShrink: 0
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center'
  },
  paginationRow: {
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.cardBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  pageText: {
    fontSize: 11,
    color: colors.textSecondary
  }
});
