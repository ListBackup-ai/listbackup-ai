import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LineChart } from 'react-native-chart-kit'

import { useAuth } from '../../hooks/useAuth'
import { useDashboardData } from '../../hooks/useDashboardData'
import { Colors } from '../../constants/Colors'

const { width: screenWidth } = Dimensions.get('window')

export default function DashboardScreen() {
  const { user } = useAuth()
  const { data: dashboardData, isLoading } = useDashboardData()

  const chartConfig = {
    backgroundColor: Colors.primary,
    backgroundGradientFrom: Colors.primary,
    backgroundGradientTo: Colors.primary,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ffa726',
    },
  }

  const mockData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43, 65],
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.userName}>{user?.firstName || 'User'}</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Ionicons name="person-circle-outline" size={32} color={Colors.gray} />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="server" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.statNumber}>
            {dashboardData?.totalSources || 0}
          </Text>
          <Text style={styles.statLabel}>Active Sources</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="cloud-upload" size={24} color={Colors.success} />
          </View>
          <Text style={styles.statNumber}>
            {dashboardData?.successfulBackups || 0}
          </Text>
          <Text style={styles.statLabel}>Successful Backups</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="folder" size={24} color={Colors.orange} />
          </View>
          <Text style={styles.statNumber}>
            {dashboardData?.totalFiles || 0}
          </Text>
          <Text style={styles.statLabel}>Total Files</Text>
        </View>
      </View>

      {/* Backup Activity Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Backup Activity</Text>
        <LineChart
          data={mockData}
          width={screenWidth - 48}
          height={200}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Recent Activity */}
      <View style={styles.recentActivity}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Keap backup completed</Text>
              <Text style={styles.activityTime}>2 minutes ago</Text>
            </View>
            <TouchableOpacity style={styles.activityAction}>
              <Ionicons name="chevron-forward" size={16} color={Colors.gray} />
            </TouchableOpacity>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="cloud-upload" size={20} color={Colors.primary} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Stripe data synced</Text>
              <Text style={styles.activityTime}>15 minutes ago</Text>
            </View>
            <TouchableOpacity style={styles.activityAction}>
              <Ionicons name="chevron-forward" size={16} color={Colors.gray} />
            </TouchableOpacity>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="warning" size={20} color={Colors.orange} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>MailChimp sync failed</Text>
              <Text style={styles.activityTime}>1 hour ago</Text>
            </View>
            <TouchableOpacity style={styles.activityAction}>
              <Ionicons name="chevron-forward" size={16} color={Colors.gray} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="add-circle" size={32} color={Colors.primary} />
            <Text style={styles.actionText}>Add Source</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="play-circle" size={32} color={Colors.success} />
            <Text style={styles.actionText}>Run Backup</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="download" size={32} color={Colors.orange} />
            <Text style={styles.actionText}>Export Data</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="settings" size={32} color={Colors.gray} />
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: Colors.black,
    marginTop: 4,
  },
  profileButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: Colors.black,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.gray,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.black,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  recentActivity: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.black,
  },
  seeAllButton: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.primary,
  },
  activityList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.black,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray,
  },
  activityAction: {
    padding: 8,
  },
  quickActions: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.black,
    marginTop: 8,
    textAlign: 'center',
  },
})

// Define additional colors
Colors.success = '#10B981'
Colors.orange = '#F59E0B'