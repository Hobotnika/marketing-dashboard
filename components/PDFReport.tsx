import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import { GoogleAdsMetrics } from '@/types/google-ads';
import { MetaAdsMetrics } from '@/types/meta-ads';
import { format } from 'date-fns';

interface PDFReportProps {
  googleData: GoogleAdsMetrics | null;
  metaData: {
    campaigns: any[];
    totals: MetaAdsMetrics;
  } | null;
  timestamp: string;
}

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #2563EB',
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  date: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  section: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 12,
    borderBottom: '1 solid #E5E7EB',
    paddingBottom: 6,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 6,
    border: '1 solid #E5E7EB',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  metricSubtext: {
    fontSize: 8,
    color: '#9CA3AF',
    marginTop: 2,
  },
  campaignRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
    marginBottom: 6,
    border: '1 solid #E5E7EB',
  },
  campaignName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1F2937',
    width: '40%',
  },
  campaignMetric: {
    fontSize: 10,
    color: '#4B5563',
    width: '20%',
    textAlign: 'right',
  },
  summary: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
    border: '1 solid #BFDBFE',
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 10,
    color: '#1E40AF',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9CA3AF',
    borderTop: '1 solid #E5E7EB',
    paddingTop: 10,
  },
});

export const PDFReport: React.FC<PDFReportProps> = ({
  googleData,
  metaData,
  timestamp,
}) => {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('en-US').format(value);

  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

  const totalSpend =
    (googleData?.spend || 0) + (metaData?.totals?.spend || 0);
  const totalConversions =
    (googleData?.clicks || 0) + (metaData?.totals?.whatsappConversations || 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Marketing Performance Report</Text>
          <Text style={styles.subtitle}>Multi-Platform Advertising Metrics</Text>
          <Text style={styles.date}>
            Generated on {format(new Date(timestamp), 'MMMM dd, yyyy - HH:mm:ss')}
          </Text>
        </View>

        {/* Executive Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Executive Summary</Text>
          <Text style={styles.summaryText}>
            Total Ad Spend: {formatCurrency(totalSpend)} • Total Conversions:{' '}
            {formatNumber(totalConversions)} • Reporting Period:{' '}
            {googleData?.dateRange
              ? `${googleData.dateRange.start} to ${googleData.dateRange.end}`
              : 'Last 30 days'}
          </Text>
        </View>

        {/* Google Ads Section */}
        {googleData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Google Ads Performance</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Impressions</Text>
                <Text style={styles.metricValue}>
                  {formatNumber(googleData.impressions)}
                </Text>
                <Text style={styles.metricSubtext}>Total ad views</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Click-Through Rate</Text>
                <Text style={styles.metricValue}>
                  {formatPercentage(googleData.ctr)}
                </Text>
                <Text style={styles.metricSubtext}>CTR performance</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total Clicks</Text>
                <Text style={styles.metricValue}>
                  {formatNumber(googleData.clicks)}
                </Text>
                <Text style={styles.metricSubtext}>User engagement</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Ad Spend</Text>
                <Text style={styles.metricValue}>
                  {formatCurrency(googleData.spend)}
                </Text>
                <Text style={styles.metricSubtext}>
                  {googleData.dateRange
                    ? `${googleData.dateRange.start} - ${googleData.dateRange.end}`
                    : 'Total investment'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Meta Ads Section */}
        {metaData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meta Ads Performance</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total Reach</Text>
                <Text style={styles.metricValue}>
                  {formatNumber(metaData.totals.reach)}
                </Text>
                <Text style={styles.metricSubtext}>Unique users reached</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>WhatsApp Conversations</Text>
                <Text style={styles.metricValue}>
                  {formatNumber(metaData.totals.whatsappConversations)}
                </Text>
                <Text style={styles.metricSubtext}>Total conversations</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Cost per Conversation</Text>
                <Text style={styles.metricValue}>
                  {formatCurrency(metaData.totals.avgCostPerConversation)}
                </Text>
                <Text style={styles.metricSubtext}>Average CPC</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Ad Spend</Text>
                <Text style={styles.metricValue}>
                  {formatCurrency(metaData.totals.spend)}
                </Text>
                <Text style={styles.metricSubtext}>Total investment</Text>
              </View>
            </View>

            {/* Campaign Breakdown */}
            {metaData.campaigns && metaData.campaigns.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: '#4B5563',
                    marginBottom: 8,
                  }}
                >
                  Campaign Breakdown
                </Text>
                {metaData.campaigns.slice(0, 5).map((campaign) => (
                  <View key={campaign.campaignId} style={styles.campaignRow}>
                    <Text style={styles.campaignName}>
                      {campaign.campaignName}
                    </Text>
                    <Text style={styles.campaignMetric}>
                      {formatNumber(campaign.reach)} reach
                    </Text>
                    <Text style={styles.campaignMetric}>
                      {campaign.whatsappConversations} conv
                    </Text>
                    <Text style={styles.campaignMetric}>
                      {formatCurrency(campaign.spend)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          This report was automatically generated by the Marketing Dashboard •
          Data last updated: {format(new Date(timestamp), 'MMM dd, yyyy HH:mm')}
        </Text>
      </Page>
    </Document>
  );
};
