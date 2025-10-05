
import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, commonStyles } from "@/styles/commonStyles";
import { Stack } from "expo-router";

export default function ProfileScreen() {
  const handleNotificationSettings = () => {
    Alert.alert("Notification Settings", "Configure your air quality alerts and notifications.");
  };

  const handleLocationSettings = () => {
    Alert.alert("Location Settings", "Manage your saved locations for air quality monitoring.");
  };

  const handleHealthProfile = () => {
    Alert.alert("Health Profile", "Set up your health conditions to receive personalized recommendations.");
  };

  const handleDataSources = () => {
    Alert.alert("Data Sources", "Learn more about our data sources and accuracy.");
  };

  const handleAbout = () => {
    Alert.alert("About", "Air Quality Monitor v1.0\n\nBuilt with NASA TEMPO satellite data, ground sensors, and weather APIs for accurate air quality forecasting.");
  };

  const renderHeaderRight = () => (
    <IconSymbol 
      name="gear" 
      color={colors.text} 
      size={20}
      style={{ padding: 8 }}
    />
  );

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "Profile & Settings",
            headerRight: renderHeaderRight,
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }}
        />
      )}
      <SafeAreaView style={[commonStyles.container, styles.container]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS !== 'ios' && styles.scrollContentWithTabBar
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* User Info Section */}
          <View style={[commonStyles.card, styles.userCard]}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <IconSymbol name="person.fill" size={40} color={colors.card} />
              </View>
            </View>
            <Text style={[commonStyles.subtitle, styles.userName]}>Air Quality User</Text>
            <Text style={[commonStyles.textSecondary, styles.userLocation]}>San Francisco, CA</Text>
          </View>

          {/* Health Profile Section */}
          <View style={styles.section}>
            <Text style={[commonStyles.subtitle, styles.sectionTitle]}>Health & Preferences</Text>
            
            <Pressable style={[commonStyles.card, styles.settingItem]} onPress={handleHealthProfile}>
              <View style={styles.settingContent}>
                <IconSymbol name="heart.fill" size={20} color={colors.accent} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Health Profile</Text>
                  <Text style={commonStyles.textSecondary}>Manage health conditions & sensitivities</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
            </Pressable>

            <Pressable style={[commonStyles.card, styles.settingItem]} onPress={handleNotificationSettings}>
              <View style={styles.settingContent}>
                <IconSymbol name="bell.fill" size={20} color={colors.secondary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Notifications</Text>
                  <Text style={commonStyles.textSecondary}>Air quality alerts & reminders</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
            </Pressable>

            <Pressable style={[commonStyles.card, styles.settingItem]} onPress={handleLocationSettings}>
              <View style={styles.settingContent}>
                <IconSymbol name="location.fill" size={20} color={colors.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Locations</Text>
                  <Text style={commonStyles.textSecondary}>Manage saved locations</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* App Info Section */}
          <View style={styles.section}>
            <Text style={[commonStyles.subtitle, styles.sectionTitle]}>App Information</Text>
            
            <Pressable style={[commonStyles.card, styles.settingItem]} onPress={handleDataSources}>
              <View style={styles.settingContent}>
                <IconSymbol name="chart.bar.fill" size={20} color={colors.highlight} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Data Sources</Text>
                  <Text style={commonStyles.textSecondary}>NASA TEMPO, OpenAQ, Weather APIs</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
            </Pressable>

            <Pressable style={[commonStyles.card, styles.settingItem]} onPress={handleAbout}>
              <View style={styles.settingContent}>
                <IconSymbol name="info.circle.fill" size={20} color={colors.textSecondary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>About</Text>
                  <Text style={commonStyles.textSecondary}>Version 1.0 - Air Quality Monitor</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Quick Stats */}
          <View style={[commonStyles.card, styles.statsCard]}>
            <Text style={[commonStyles.subtitle, styles.sectionTitle]}>Your Air Quality Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>7</Text>
                <Text style={commonStyles.textSecondary}>Days monitored</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>3</Text>
                <Text style={commonStyles.textSecondary}>Alerts received</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>85</Text>
                <Text style={commonStyles.textSecondary}>Avg AQI</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  userCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    color: colors.text,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  statsCard: {
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
});
