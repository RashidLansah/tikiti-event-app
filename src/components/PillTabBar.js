import React from 'react';
import { View, TouchableOpacity, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography } from '../styles/designSystem';

/**
 * PillTabBar — Horizontal scrollable pill tab component
 * Matches Figma design: gray container (border-radius: 40), active tab has white bg pill
 *
 * @param {Array} tabs - Array of { key, label, icon } objects
 * @param {string} activeTab - Key of the active tab
 * @param {function} onTabPress - Callback when a tab is pressed
 */
const PillTabBar = ({ tabs, activeTab, onTabPress }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
            >
              {tab.icon && (
                <Feather
                  name={tab.icon}
                  size={14}
                  color={Colors.primary[500]}
                />
              )}
              <Text
                style={[styles.tabLabel, isActive && styles.activeTabLabel]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    borderRadius: 40,
    height: 50,
    paddingHorizontal: 6,
    paddingVertical: 7,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 30,
    gap: 5,
  },
  activeTab: {
    backgroundColor: Colors.white,
  },
  tabLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 13,
    color: Colors.primary[500],
  },
  activeTabLabel: {
    fontFamily: Typography.fontFamily.semibold,
  },
});

export default PillTabBar;
