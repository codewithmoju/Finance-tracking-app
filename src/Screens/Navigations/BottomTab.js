import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { THEME_COLORS, SPACING } from '../../global/styles';
import Home from '../HomeScreen/Home';
import TransactionStack from './TransactionStack';
import IncomeStack from './IncomeStack';
import ProfileStack from './ProfileStack';
import Insights from '../InsightScreens/Insights';
import { View, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const animatedValues = React.useRef(state.routes.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Animate the initial selected tab
    Animated.spring(animatedValues[state.index], {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7
    }).start();
  }, []);

  return (
    <LinearGradient
      colors={[THEME_COLORS.primary.main, THEME_COLORS.primary.dark]}
      style={styles.tabBar}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || route.name;
        const isFocused = state.index === index;

        // Get the icon component
        const icon = options.tabBarIcon({
          color: isFocused ? THEME_COLORS.primary.main : THEME_COLORS.text.secondary,
          size: 24
        });

        // Animation values
        const scale = animatedValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.2]
        });

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            Haptics.selectionAsync();
            // Reset all animations
            animatedValues.forEach((anim, i) => {
              Animated.spring(anim, {
                toValue: i === index ? 1 : 0,
                useNativeDriver: true,
                tension: 50,
                friction: 7
              }).start();
            });
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
          >
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale }],
                }
              ]}
            >
              <LinearGradient
                colors={isFocused ? THEME_COLORS.gradient.primary : ['transparent', 'transparent']}
                style={styles.iconBackground}
              >
                {icon}
              </LinearGradient>
            </Animated.View>
            {isFocused && (
              <View style={[styles.indicator]} />
            )}
          </TouchableOpacity>
        );
      })}
    </LinearGradient>
  );
};

const BottomTab = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TransactionStack"
        component={TransactionStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="receipt-long" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="IncomeStack"
        component={IncomeStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="account-balance-wallet" size={size} color={color} />
          ),
        }}
      />
      {/* <Tab.Screen
        name="Insights"
        component={Insights}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="insights" size={size} color={color} />
          ),
        }}
      /> */}
      <Tab.Screen
        name="ProfileStack"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    padding: 8,
  },
  iconBackground: {
    padding: 8,
    borderRadius: 12,
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME_COLORS.primary.main,
    marginTop: 4,
  },
});

export default BottomTab;
