import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { homeScreenStyles } from '../../app/GlobalStyles';

const HomeScreen = () => {
  return (
    <View style={homeScreenStyles.container}>
      <Text style={homeScreenStyles.title}>Welcome to Valuations App</Text>
      <Text style={homeScreenStyles.subtitle}>Your property valuation companion</Text>
    </View>
  );
};

export default HomeScreen; 