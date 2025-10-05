
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { colors } from '@/styles/commonStyles';

export interface TabBarItem {
  name: string;
  title: string;
  icon: string;
  color: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
}

export default function FloatingTabBar({
  tabs,
  containerWidth = Dimensions.get('window').width - 32,
  borderRadius = 25,
  bottomMargin = 34,
}: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  
  const activeIndex = useSharedValue(0);

  React.useEffect(() => {
    const currentIndex = tabs.findIndex(tab => {
      if (tab.name === '(home)') {
        return pathname === '/' || pathname.startsWith('/(home)');
      }
      return pathname.includes(tab.name);
    });
    activeIndex.value = withSpring(currentIndex >= 0 ? currentIndex : 0);
  }, [pathname, tabs]);

  const handleTabPress = (route: string) => {
    console.log('Tab pressed:', route);
    if (route === '(home)') {
      router.push('/');
    } else {
      router.push(`/${route}` as any);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      activeIndex.value,
      tabs.map((_, index) => index),
      tabs.map((_, index) => (index * containerWidth) / tabs.length)
    );

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <SafeAreaView style={[styles.safeArea, { bottom: bottomMargin }]} edges={['bottom']}>
      <BlurView intensity={80} style={[styles.container, { width: containerWidth, borderRadius }]}>
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              width: containerWidth / tabs.length,
              borderRadius: borderRadius - 4,
              backgroundColor: colors.primary,
            },
            animatedStyle,
          ]}
        />
        {tabs.map((tab, index) => {
          const isActive = pathname === '/' ? tab.name === '(home)' : pathname.includes(tab.name);
          
          return (
            <TouchableOpacity
              key={tab.name}
              style={[styles.tab, { width: containerWidth / tabs.length }]}
              onPress={() => handleTabPress(tab.name)}
              activeOpacity={0.7}
            >
              <IconSymbol
                name={tab.icon}
                size={24}
                color={isActive ? colors.card : colors.text}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isActive ? colors.card : colors.text,
                  },
                ]}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.card,
    ...Platform.select({
      ios: {},
      default: {
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
    }),
  },
  activeIndicator: {
    position: 'absolute',
    height: '80%',
    top: '10%',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    zIndex: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});
