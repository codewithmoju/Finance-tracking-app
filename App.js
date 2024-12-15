import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import RootNavigator from './src/Screens/Navigations/RootNavigator';
import { colors, THEME_COLORS } from './src/global/styles';

export default function App() {
  return (
    <View style={styles.container}>
      <RootNavigator />
      <StatusBar style="light" 
      translucent={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:colors.richBlack,
  },
});
