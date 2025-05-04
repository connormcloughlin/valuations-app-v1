import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  // Provide a fallback backgroundColor if undefined
  const safeBackgroundColor = backgroundColor || '#f5f6fa';

  return <View style={[{ backgroundColor: safeBackgroundColor }, style]} {...otherProps} />;
}
