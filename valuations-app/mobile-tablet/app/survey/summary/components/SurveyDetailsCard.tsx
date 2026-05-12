import React from 'react';
import { View, Text } from 'react-native';
import { Card } from 'react-native-paper';
import { surveyDetailsCardStyles } from '../../../GlobalStyles';
import { formatZarCurrency } from '../../../../utils/currencyFormat';

interface SurveyDetailsCardProps {
  orderNumber: string;
  policyNo: string;
  sumInsured: string;
  broker: string;
  date: string;
}

export default function SurveyDetailsCard({ orderNumber, policyNo, sumInsured, broker, date }: SurveyDetailsCardProps) {
  return (
    <View style={surveyDetailsCardStyles.sectionContainer}>
      <Text style={surveyDetailsCardStyles.sectionTitle}>Survey Details</Text>
      <Card style={surveyDetailsCardStyles.detailsCard}>
        <Card.Content>
          <View style={surveyDetailsCardStyles.detailRow}>
            <Text style={surveyDetailsCardStyles.detailLabel}>Order Number:</Text>
            <Text style={surveyDetailsCardStyles.detailValue}>{orderNumber}</Text>
          </View>
          <View style={surveyDetailsCardStyles.detailRow}>
            <Text style={surveyDetailsCardStyles.detailLabel}>Policy Number:</Text>
            <Text style={surveyDetailsCardStyles.detailValue}>{policyNo}</Text>
          </View>
          <View style={surveyDetailsCardStyles.detailRow}>
            <Text style={surveyDetailsCardStyles.detailLabel}>Sum Insured:</Text>
            <Text style={surveyDetailsCardStyles.detailValue}>{formatZarCurrency(sumInsured)}</Text>
          </View>
          <View style={surveyDetailsCardStyles.detailRow}>
            <Text style={surveyDetailsCardStyles.detailLabel}>Broker:</Text>
            <Text style={surveyDetailsCardStyles.detailValue}>{broker}</Text>
          </View>
          <View style={surveyDetailsCardStyles.detailRow}>
            <Text style={surveyDetailsCardStyles.detailLabel}>Date:</Text>
            <Text style={surveyDetailsCardStyles.detailValue}>{date}</Text>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

