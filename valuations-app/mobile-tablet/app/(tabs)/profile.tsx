import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { logNavigation } from '../../utils/logger';
import { useAuth } from '../../context/AuthContext';
import { profileTabStyles } from '../GlobalStyles';

export default function ProfileScreen() {
  const { user, logout, isLoading } = useAuth();
  
  logNavigation('Profile Tab');

  // Format user details from Azure AD
  const userDetails = user ? {
    name: user.name || 'Unknown User',
    email: user.email || 'No email provided',
    id: user.id || 'No ID',
    isAzureAd: user.token && user.token.length > 50 // Assume long tokens are from Azure AD
  } : null;

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ]
    );
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <View style={profileTabStyles.container}>
      <View style={profileTabStyles.header}>
        <View style={profileTabStyles.avatarContainer}>
          <Text style={profileTabStyles.avatarText}>
            {userDetails ? getInitials(userDetails.name) : 'GU'}
          </Text>
        </View>
        <Text style={profileTabStyles.name}>{userDetails?.name || 'Guest User'}</Text>
        <Text style={profileTabStyles.email}>{userDetails?.email || 'Not logged in'}</Text>
        {userDetails?.isAzureAd && (
          <View style={profileTabStyles.azureBadge}>
            <Text style={profileTabStyles.azureBadgeText}>Azure AD</Text>
          </View>
        )}
      </View>

      <View style={profileTabStyles.section}>
        <Text style={profileTabStyles.sectionTitle}>Account Information</Text>
        {userDetails && (
          <>
            <View style={profileTabStyles.infoItem}>
              <Text style={profileTabStyles.infoLabel}>Full Name</Text>
              <Text style={profileTabStyles.infoValue}>{userDetails.name}</Text>
            </View>
            <View style={profileTabStyles.infoItem}>
              <Text style={profileTabStyles.infoLabel}>Email Address</Text>
              <Text style={profileTabStyles.infoValue}>{userDetails.email}</Text>
            </View>
            <View style={profileTabStyles.infoItem}>
              <Text style={profileTabStyles.infoLabel}>User ID</Text>
              <Text style={profileTabStyles.infoValue}>{userDetails.id}</Text>
            </View>
            <View style={profileTabStyles.infoItem}>
              <Text style={profileTabStyles.infoLabel}>Authentication</Text>
              <Text style={profileTabStyles.infoValue}>
                {userDetails.isAzureAd ? 'Azure Active Directory' : 'Local Account'}
              </Text>
            </View>
          </>
        )}
      </View>

      <View style={profileTabStyles.section}>
        <Text style={profileTabStyles.sectionTitle}>Account Settings</Text>
        <TouchableOpacity style={profileTabStyles.menuItem}>
          <Text style={profileTabStyles.menuText}>Personal Information</Text>
        </TouchableOpacity>
        <TouchableOpacity style={profileTabStyles.menuItem}>
          <Text style={profileTabStyles.menuText}>Notification Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={profileTabStyles.menuItem}>
          <Text style={profileTabStyles.menuText}>Security</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[profileTabStyles.logoutButton, isLoading && profileTabStyles.logoutButtonDisabled]} 
        onPress={handleLogout}
        disabled={isLoading}
      >
        <Text style={profileTabStyles.logoutText}>
          {isLoading ? 'Logging out...' : 'Log Out'}
        </Text>
      </TouchableOpacity>
    </View>
  );
} 