import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { profileScreenStyles } from '../../app/GlobalStyles';

const ProfileScreen = () => {
  return (
    <View style={profileScreenStyles.container}>
      <View style={profileScreenStyles.header}>
        <View style={profileScreenStyles.avatarContainer}>
          <Text style={profileScreenStyles.avatarText}>JD</Text>
        </View>
        <Text style={profileScreenStyles.name}>John Doe</Text>
        <Text style={profileScreenStyles.email}>john.doe@example.com</Text>
      </View>

      <View style={profileScreenStyles.section}>
        <Text style={profileScreenStyles.sectionTitle}>Account Settings</Text>
        <TouchableOpacity style={profileScreenStyles.menuItem}>
          <Text style={profileScreenStyles.menuText}>Personal Information</Text>
        </TouchableOpacity>
        <TouchableOpacity style={profileScreenStyles.menuItem}>
          <Text style={profileScreenStyles.menuText}>Notification Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={profileScreenStyles.menuItem}>
          <Text style={profileScreenStyles.menuText}>Security</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={profileScreenStyles.logoutButton}>
        <Text style={profileScreenStyles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileScreen; 