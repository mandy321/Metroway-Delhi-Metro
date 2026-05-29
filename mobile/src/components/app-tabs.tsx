import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';
import { useMetroStore } from '../store/useMetroStore';
import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const store = useMetroStore();
  const activeTheme = 'dark';
  const colors = Colors[activeTheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={activeTheme === 'dark' ? '#333333' : '#E5E5EA'}
      labelStyle={{ selected: { color: colors.text, fontWeight: "600" } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="map">
        <NativeTabs.Trigger.Label>Map</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/map.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="smart-access">
        <NativeTabs.Trigger.Label>Smart Access</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
