import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

type Orientation = 'portrait' | 'landscape';

export function useOrientation(): {
  orientation: Orientation;
  isPortrait: boolean;
  isLandscape: boolean;
  screenWidth: number;
  screenHeight: number;
} {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  
  const isPortrait = screenHeight > screenWidth;
  const isLandscape = screenWidth > screenHeight;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
      setScreenHeight(window.height);
    });
    
    return () => subscription.remove();
  }, []);

  return {
    orientation: isPortrait ? 'portrait' : 'landscape',
    isPortrait,
    isLandscape,
    screenWidth,
    screenHeight,
  };
} 