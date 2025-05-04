import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

export default function OrientationTest() {
  const [dimensions, setDimensions] = React.useState({
    window: Dimensions.get('window'),
  });

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ window });
    });
    return () => subscription.remove();
  }, []);

  const { width, height } = dimensions.window;
  const isLandscape = width > height;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Width: {width}</Text>
      <Text style={styles.text}>Height: {height}</Text>
      <Text style={styles.text}>
        Orientation: {isLandscape ? 'Landscape' : 'Portrait'}
      </Text>
      <View
        style={[
          styles.box,
          {
            backgroundColor: isLandscape ? 'green' : 'blue',
            width: isLandscape ? '80%' : '50%',
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    marginBottom: 15,
  },
  box: {
    height: 100,
    marginTop: 20,
  },
}); 