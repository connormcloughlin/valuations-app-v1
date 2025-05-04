/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#4a90e2';
const tintColorDark = '#6fa8dc';

export const Colors = {
  light: {
    text: '#2c3e50',
    background: '#f5f6fa',
    tint: tintColorLight,
    tabIconDefault: '#95a5a6',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ecf0f1',
    background: '#2c3e50',
    tint: tintColorDark,
    tabIconDefault: '#7f8c8d',
    tabIconSelected: tintColorDark,
  },
};

export default Colors;
