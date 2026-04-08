import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Button, Card, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

import { useAuth } from '../../context/AuthContext';
import { colors } from '../GlobalStyles';
import { currencyFormat, dateFormat } from '../../utils/formatting';
import { getCommissionPayroll } from '../../api/payroll';
import type { MobilePayrollLine, MobilePayrollResponse } from '../../types/payroll';

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

export default function CommissionScreen() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [period, setPeriod] = useState<string>(() => yymmFromDate(new Date()));
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(25);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<MobilePayrollResponse | null>(null);

  const summary = payload?.summary;
  const { surveyorName, lines } = useMemo(
    () => (payload ? normalizeSurveyorGroup(payload) : { surveyorName: undefined, lines: [] }),
    [payload]
  );

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

  const renderLine = ({ item }: { item: MobilePayrollLine }) => {
    const commissionShown =
      item.commissionAmountFinal ?? item.commissionAmount ?? 0;

    return (
      <Card style={styles.lineCard}>
        <Card.Content>
          <View style={styles.lineHeader}>
            <Text style={styles.lineTitle} numberOfLines={1}>
              {item.assessmentNo ?? `Assessment #${item.riskAssessmentId}`}
            </Text>
            <Text style={styles.lineTotal}>{currencyFormat(item.totalPayrollAmount ?? 0)}</Text>
          </View>

          <Text style={styles.lineSubtitle} numberOfLines={1}>
            {item.clientName ?? 'Unknown client'}
          </Text>

          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="calendar" size={14} color={colors.gray[600]} />
            <Text style={styles.metaText}>Surveyed {dateFormat(item.surveyDate)}</Text>
          </View>

          <View style={styles.valueGrid}>
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Base fee</Text>
              <Text style={styles.valueText}>{currencyFormat(item.baseFee ?? 0)}</Text>
            </View>
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Commission %</Text>
              <Text style={styles.valueText}>{(item.commissionPercent ?? 0).toFixed(2)}%</Text>
            </View>
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Commission</Text>
              <Text style={styles.valueText}>{currencyFormat(commissionShown)}</Text>
            </View>
            {item.commissionAmountOriginal != null && (
              <View style={styles.valueItem}>
                <Text style={styles.valueLabel}>Commission (original)</Text>
                <Text style={styles.valueText}>{currencyFormat(item.commissionAmountOriginal)}</Text>
              </View>
            )}
            {item.commissionReductionAmount != null && (
              <View style={styles.valueItem}>
                <Text style={styles.valueLabel}>Reduction</Text>
                <Text style={styles.valueText}>{currencyFormat(item.commissionReductionAmount)}</Text>
              </View>
            )}
            {item.slaDaysOver != null && (
              <View style={styles.valueItem}>
                <Text style={styles.valueLabel}>SLA days over</Text>
                <Text style={styles.valueText}>{item.slaDaysOver}</Text>
              </View>
            )}
            {item.slaCommissionMultiplier != null && (
              <View style={styles.valueItem}>
                <Text style={styles.valueLabel}>SLA multiplier</Text>
                <Text style={styles.valueText}>{item.slaCommissionMultiplier}</Text>
              </View>
            )}
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Km</Text>
              <Text style={styles.valueText}>{(item.totalMileageKm ?? 0).toFixed(0)} km</Text>
            </View>
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Travel fee</Text>
              <Text style={styles.valueText}>{currencyFormat(item.travelFee ?? 0)}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'My Commission', headerTitleStyle: { fontWeight: '600' } }} />

      <View style={styles.container}>
        {!isAuthenticated || !user ? (
          <View style={styles.center}>
            <Text style={styles.infoText}>Sign in to view your commission.</Text>
          </View>
        ) : (
          <>
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

            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.infoText}>Loading commission...</Text>
              </View>
            ) : error ? (
              <View style={styles.center}>
                <MaterialCommunityIcons name="alert-circle-outline" size={44} color={colors.danger} />
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
              <>
                <View style={styles.summaryRow}>
                  <Card style={styles.summaryCard}>
                    <Card.Content>
                      <Text style={styles.summaryLabel}>Commission</Text>
                      <Text style={styles.summaryValue}>{currencyFormat(summary.totalCommission ?? 0)}</Text>
                    </Card.Content>
                  </Card>
                  <Card style={styles.summaryCard}>
                    <Card.Content>
                      <Text style={styles.summaryLabel}>Mileage</Text>
                      <Text style={styles.summaryValue}>{currencyFormat(summary.totalMileagePay ?? 0)}</Text>
                    </Card.Content>
                  </Card>
                </View>

                <View style={styles.summaryRow}>
                  <Card style={styles.summaryCard}>
                    <Card.Content>
                      <Text style={styles.summaryLabel}>Total</Text>
                      <Text style={styles.summaryValue}>{currencyFormat(summary.totalPayroll ?? 0)}</Text>
                    </Card.Content>
                  </Card>
                  <Card style={styles.summaryCard}>
                    <Card.Content>
                      <Text style={styles.summaryLabel}>Assessments</Text>
                      <Text style={styles.summaryValue}>{summary.assessmentCount ?? lines.length}</Text>
                    </Card.Content>
                  </Card>
                </View>

                <FlatList
                  data={lines}
                  renderItem={renderLine}
                  keyExtractor={(item) => `payroll-${item.payrollLineId}`}
                  contentContainerStyle={styles.listContent}
                  onRefresh={fetchData}
                  refreshing={loading}
                />

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
              </>
            )}
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
  },
  controlsCard: {
    margin: 16,
    marginBottom: 10,
    borderRadius: 12,
  },
  controlsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#7f8c8d',
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  periodInput: {
    flex: 1,
    backgroundColor: '#fff',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  lineCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  lineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 4,
  },
  lineTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#2c3e50',
  },
  lineTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
  },
  lineSubtitle: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  metaText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  valueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  valueItem: {
    width: '47%',
  },
  valueLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  valueText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
  },
  infoText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    textAlign: 'center',
  },
  paginationRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 70,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(245, 246, 250, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
});

