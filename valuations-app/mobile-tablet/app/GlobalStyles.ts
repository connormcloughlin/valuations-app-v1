// GlobalStyles.ts
// This file consolidates all StyleSheet.create objects from the app
import { StyleSheet, Platform } from 'react-native';

// ============================================================================
// GLOBAL STYLES - COMPREHENSIVE THEME SYSTEM
// ============================================================================
//
// USAGE GUIDE:
//
// 1. THEME CONSTANTS:
//    - colors: Use colors.primary, colors.textPrimary, etc.
//    - spacing: Use spacing.lg, spacing.xl, etc.
//    - borderRadius: Use borderRadius.md, borderRadius.lg, etc.
//    - typography: Use typography.lg, typography.semibold, etc.
//    - shadows: Use shadows.sm, shadows.md, shadows.lg
//
// 2. TYPOGRAPHY SYSTEM:
//    - textStyles.displayLarge, textStyles.h1, textStyles.bodyMedium, etc.
//    - Provides consistent typography across the app
//    - Includes proper line heights and font weights
//
// 3. COMMON STYLES:
//    - commonStyles: Reusable components like buttons, inputs, cards
//    - appointmentStyles: Consolidated appointment-related styles
//
// 4. MIGRATION GUIDE:
//    - Replace hardcoded colors with colors.*
//    - Replace hardcoded spacing with spacing.*
//    - Replace hardcoded typography with textStyles.*
//    - Use commonStyles for repeated patterns
//
// EXAMPLE USAGE:
// ```
// import { colors, spacing, textStyles, commonStyles } from './GlobalStyles';
//
// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: colors.background,
//     padding: spacing.lg,
//   },
//   title: textStyles.h1,
//   button: commonStyles.primaryButton,
// });
// ```
// ============================================================================

// ============================================================================
// THEME CONSTANTS - Colors, Spacing, and Typography
// ============================================================================

// Color Palette
export const colors = {
  // Primary Colors
  primary: '#4a90e2',
  primaryDark: '#3498db',
  primaryLight: '#6ba3e8',
  
  // Secondary Colors
  secondary: '#2c3e50',
  secondaryLight: '#34495e',
  secondaryDark: '#1a252f',
  
  // Success/Error/Warning
  success: '#27ae60',
  successLight: '#2ecc71',
  error: '#e74c3c',
  errorLight: '#ff4444',
  warning: '#f39c12',
  warningLight: '#f1c40f',
  
  // Neutral Colors
  white: '#fff',
  black: '#000',
  gray: {
    50: '#f8f9fa',
    100: '#f0f4f7',
    200: '#e9ecef',
    300: '#e0e0e0',
    400: '#ddd',
    500: '#7f8c8d',
    600: '#6c757d',
    700: '#95a5a6',
    800: '#666',
    900: '#333',
  },
  
  // Background Colors
  background: '#f5f6fa',
  backgroundLight: '#f5f5f5',
  cardBackground: '#fff',
  
  // Text Colors
  textPrimary: '#2c3e50',
  textSecondary: '#7f8c8d',
  textMuted: '#95a5a6',
  textLight: '#666',
  
  // Border Colors
  border: '#ddd',
  borderLight: '#eee',
  borderDark: '#e0e0e0',
  
  // Status Colors
  statusSuccess: '#e8f6ef',
  statusError: '#ffeded',
  statusWarning: '#fff3e0',
  statusInfo: '#e3f2fd',
};

// Spacing Scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

// Border Radius Scale
export const borderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
};

// Typography Scale
export const typography = {
  // Font Sizes
  xs: 10,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  xxxxl: 28,
  xxxxxl: 32,
  
  // Font Weights
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  
  // Line Heights
  lineHeightTight: 1.2,
  lineHeightNormal: 1.4,
  lineHeightRelaxed: 1.6,
  lineHeightLoose: 1.8,
};

// Shadow Styles
export const shadows = {
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

// ============================================================================
// CONSOLIDATION ANALYSIS & RECOMMENDATIONS
// ============================================================================

// ============================================================================
// SHARED/COMMON STYLES - Consolidate duplicate definitions
// ============================================================================

export const commonStyles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    ...shadows.md,
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: typography.lg,
    color: colors.textSecondary,
  },

  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.lg,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.lg,
  },

  // Empty States
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxxl,
  },
  emptyText: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    fontSize: typography.base,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  // Buttons
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.lg,
    fontWeight: typography.semibold,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: typography.lg,
    fontWeight: typography.semibold,
  },

  // Input Fields
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.lg,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.error,
  },

  // Typography
  title: {
    fontSize: typography.xxxl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  bodyText: {
    fontSize: typography.base,
    color: colors.textPrimary,
  },
  captionText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },

  // Section Headers
  sectionTitle: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  // Status Chips
  statusChip: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statusChipText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.white,
  },

  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    width: '90%',
    maxHeight: '80%',
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  modalTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },

  // Pagination
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
  },
  paginationButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
  },
  paginationButtonText: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.semibold,
  },
});

// ============================================================================
// EXISTING STYLE OBJECTS - Updated to use shared styles where possible
// ============================================================================

export const surveySummaryStyles = StyleSheet.create({
  container: commonStyles.container,
  loadingContainer: commonStyles.loadingContainer,
  loadingText: commonStyles.loadingText,
  centeredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#3498db',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: commonStyles.sectionTitle,
  notesCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
});

export const surveySummaryHeaderStyles = StyleSheet.create({
  headerCard: {
    marginBottom: 16,
    borderRadius: 8,
  },
  statusRow: commonStyles.row,
  statusChip: {
    backgroundColor: '#e8f6ef',
    height: 28,
  },
  statusChipText: {
    fontSize: 12,
    color: '#27ae60',
  },
  completionDate: commonStyles.captionText,
  clientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  addressRow: commonStyles.row,
  addressText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 8,
  },
});

export const surveyDetailsCardStyles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: commonStyles.sectionTitle,
  detailsCard: {
    borderRadius: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 120,
    fontSize: 14,
    color: '#7f8c8d',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
});

export const valuationSummaryCardStyles = StyleSheet.create({
  sectionContainer: {
    marginLeft: 16,
    marginTop: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#e8f6ef',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  summaryCard: {
    borderRadius: 8,
  },
  assessmentTypeSummary: {
    paddingVertical: 12,
  },
  assessmentTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assessmentTypeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
  assessmentTypeValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#27ae60',
  },
  assessmentTypeItemCount: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 4,
  },
  divider: {
    marginVertical: 8,
  },
  totalDivider: {
    height: 1.5,
    backgroundColor: '#27ae60',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  totalValueBold: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  sectionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495e',
  },
  sectionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#27ae60',
  },
  sectionItemCount: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 2,
  },
  categoryContainer: {
    marginLeft: 16,
    marginTop: 8,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#ecf0f1',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '400',
    color: '#7f8c8d',
  },
  categoryValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#27ae60',
  },
  categoryItemCount: {
    fontSize: 11,
    color: '#bdc3c7',
    marginTop: 2,
  },
});

export const surveySummaryActionsStyles = StyleSheet.create({
  buttonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  topRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  shareButton: {
    flex: 1,
    marginRight: 8,
    borderColor: '#3498db',
  },
  pdfButton: {
    flex: 1,
    marginLeft: 8,
    borderColor: '#9b59b6',
  },
  completeButton: {
    backgroundColor: '#2ecc71',
    marginTop: 8,
  },
});

export const surveyItemsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
});

export const appointmentDetailsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  scrollView: {
    flex: 1,
  },
  centered: commonStyles.centered,
  card: commonStyles.card,
  loadingText: {
    marginTop: 10,
    color: '#7f8c8d',
  },
  errorText: {
    color: '#e74c3c',
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 10,
  },
  mapContainer: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  mapCard: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  mapContent: {
    padding: 0,
  },
  mapImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  mapButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#4a90e2',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  mapButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'column',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  rescheduleButton: {
    flex: 1,
    marginRight: 8,
    borderColor: '#3498db',
  },
  startButton: {
    flex: 1,
    backgroundColor: '#4a90e2',
  },
  actionButton: {
    marginTop: 16,
    backgroundColor: '#4a90e2',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  prefetchContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  rowContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
  },
  halfWidth: {
    flex: 1,
    margin: 0,
    marginHorizontal: 4,
  },
});

export const userItemsTableStyles = StyleSheet.create({
  card: {
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  totalRow: {
    backgroundColor: '#f0f4f7',
  },
  totalLabel: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  totalValue: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#27ae60',
  },
  itemDescriptionCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4a90e2',
    marginRight: 6,
  },
});

export const photoGalleryModalStyles = StyleSheet.create({
  modalContainer: commonStyles.modalContainer,
  modalContent: {
    width: '95%',
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalHeader: commonStyles.modalHeader,
  modalTitle: commonStyles.modalTitle,
  emptyState: commonStyles.emptyContainer,
  emptyStateText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  takePhotoButton: {
    backgroundColor: '#4a90e2',
  },
  photosContainer: {
    maxHeight: 400,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 68, 68, 0.8)',
    borderRadius: 12,
    padding: 4,
  },
  bottomActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  addPhotoButton: {
    backgroundColor: '#4a90e2',
  },
  fullImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  fullImage: {
    width: '90%',
    height: '70%',
  },
  fullImageActions: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  deletePhotoButton: {
    borderColor: '#ff4444',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});

export const itemStatesStyles = StyleSheet.create({
  loadingContainer: commonStyles.loadingContainer,
  loadingText: commonStyles.loadingText,
  errorContainer: commonStyles.errorContainer,
  errorText: commonStyles.errorText,
  retryButton: {
    backgroundColor: '#3498db',
  },
  offlineHint: {
    marginTop: 16,
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  emptyState: commonStyles.emptyContainer,
  emptyStateText: commonStyles.emptyText,
  emptyStateSubtext: commonStyles.emptySubtext,
});

export const itemsSummaryStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: '600',
    color: '#27ae60',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    height: 48,
    justifyContent: 'center',
    backgroundColor: '#4a90e2',
    flex: 1,
  },
  addButtonContent: {
    height: 48,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  syncButton: {
    height: 48,
    justifyContent: 'center',
    flex: 1,
  },
  syncButtonContent: {
    height: 48,
  },
  syncButtonText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  doneButton: {
    height: 48,
    justifyContent: 'center',
    backgroundColor: '#2c3e50',
    flex: 1,
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export const cameraModalStyles = StyleSheet.create({
  modalContainer: commonStyles.modalContainer,
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  photoOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 32,
  },
  photoOption: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f0f4f7',
    width: '45%',
  },
  photoOptionText: {
    marginTop: 12,
    fontSize: 16,
    color: '#34495e',
    textAlign: 'center',
  },
});

export const appointmentsInProgressStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    elevation: 2,
    borderRadius: 8,
  },
  refreshButton: {
    borderRadius: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  appointmentCard: {
    marginBottom: 12,
    borderRadius: 8,
  },
  appointmentHeader: commonStyles.row,
  icon: {
    marginRight: 8,
  },
  appointmentAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  appointmentDetails: {
    marginTop: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailIcon: {
    marginRight: 8,
    width: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  continueButton: {
    marginTop: 4,
    backgroundColor: '#f39c12',
    borderRadius: 4,
    height: 36,
  },
  buttonLabel: {
    fontSize: 12,
    marginVertical: 0,
  },
  loadingContainer: commonStyles.loadingContainer,
  loadingText: commonStyles.loadingText,
  errorContainer: commonStyles.errorContainer,
  errorText: commonStyles.errorText,
  retryButton: {
    marginTop: 10,
  },
  emptyContainer: commonStyles.emptyContainer,
  emptyText: commonStyles.emptyText,
  emptySubtext: commonStyles.emptySubtext,
  paginationContainer: {
    ...commonStyles.paginationContainer,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  paginationButton: {
    minWidth: 100,
  },
  paginationText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
}); 

// Note: loginScreenStyles and loginStyles are nearly identical
// Consider consolidating into a single loginStyles object

export const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  passwordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    height: 50,
  },
  passwordInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 0,
    borderWidth: 0,
  },
  passwordToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPassword: {
    marginTop: 20,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
  },
  azureButton: {
    backgroundColor: '#0066CC',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  azureButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  statusContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 

export const appHeaderStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5d6d7e',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    color: '#2c3e50',
    marginRight: 12,
  },
  logoutButton: {
    padding: 4,
  },
}); 

export const appLayoutStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  content: {
    flex: 1,
  },
}); 

export const bottomNavigationStyles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
  },
  tabButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 16,
  },
  labelContainer: {
    marginTop: 4,
    overflow: 'hidden',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  tabBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#e74c3c',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabIconWrap: {
    position: 'relative',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
}); 

export const connectionStatusStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40, // Adjusted to be visible below status bar
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 999,
  },
  offlineContainer: {
    backgroundColor: '#e74c3c',
  },
  onlineContainer: {
    backgroundColor: '#2ecc71',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  offlineText: {
    color: '#fff',
  },
  onlineText: {
    color: '#fff',
  },
  subText: {
    fontSize: 12,
    fontWeight: 'normal',
    opacity: 0.8,
  },
  refreshButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
}); 

export const offlineNoticeStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    zIndex: 1000,
  },
  offlineContainer: {
    backgroundColor: '#e74c3c',
  },
  onlineContainer: {
    backgroundColor: '#2ecc71',
  },
  text: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '500',
  },
}); 

export const dashboardHeaderStyles = StyleSheet.create({
  header: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 5,
  },
}); 

export const statsCardsStyles = StyleSheet.create({
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    backgroundColor: 'transparent',
  },
  card: {
    width: '45%',
    margin: '2.5%',
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    color: '#34495e',
    marginTop: 10,
  },
  cardCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 5,
  },
  pendingCount: {
    color: '#f39c12',
  },
  syncStatus: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 5,
  },
  debugCard: {
    backgroundColor: '#e74c3c',
  },
  debugStatus: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
  },
}); 

export const todaysAppointmentsStyles = StyleSheet.create({
  section: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  appointmentCard: {
    borderRadius: 12,
    marginBottom: 10,
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  appointmentContent: {
    marginLeft: 15,
    flex: 1,
    backgroundColor: 'transparent',
  },
  appointmentAddress: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  appointmentDetails: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  policyText: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 1,
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#95a5a6',
    fontSize: 14,
    padding: 15,
  },
  loadingMessage: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 14,
    padding: 15,
  },
  errorMessage: {
    textAlign: 'center',
    color: '#e74c3c',
    fontSize: 14,
    padding: 15,
  },
  retryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 10,
  },
  retryText: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 14,
  },
}); 

export const surveysInProgressStyles = StyleSheet.create({
  section: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  appointmentCard: {
    borderRadius: 12,
    marginBottom: 10,
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  appointmentContent: {
    marginLeft: 15,
    flex: 1,
    backgroundColor: 'transparent',
  },
  appointmentAddress: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  appointmentDetails: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#95a5a6',
    fontSize: 14,
    padding: 15,
  },
  loadingMessage: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 14,
    padding: 15,
  },
  errorMessage: {
    textAlign: 'center',
    color: '#e74c3c',
    fontSize: 14,
    padding: 15,
  },
  retryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 10,
  },
  retryText: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 14,
  },
}); 

export const developmentToolsStyles = StyleSheet.create({
  section: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  debugSection: {
    padding: 20,
    backgroundColor: '#fff',
  },
  debugButton: {
    marginBottom: 10,
  },
}); 

export const batchSyncManagerStyles = StyleSheet.create({
  container: {
    margin: 16,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#212121',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  currentItemSection: {
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  currentItemText: {
    fontSize: 12,
    color: '#1976D2',
    fontFamily: 'monospace',
  },
  resultSection: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 8,
  },
  errorsSection: {
    marginTop: 8,
  },
  errorsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: 4,
  },
  errorItem: {
    fontSize: 11,
    color: '#D32F2F',
    marginLeft: 8,
    marginBottom: 2,
  },
  moreErrors: {
    fontSize: 11,
    color: '#757575',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  errorSection: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
  },
  buttonSection: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#2196F3',
    flex: 1,
  },
  cancelButton: {
    borderColor: '#FF5722',
    flex: 1,
  },
}); 

export const prefetchProgressIndicatorStyles = StyleSheet.create({
  container: {
    margin: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  minimizedContainer: {
    marginHorizontal: 8,
    marginVertical: 4,
  },
  minimizedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  minimizedText: {
    marginLeft: 8,
    marginRight: 4,
    fontSize: 12,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
  },
  title: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  minimizeButton: {
    margin: 0,
    padding: 0,
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  currentTask: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  completedText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    marginLeft: 6,
    fontSize: 11,
    color: '#666',
  },
  offlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    margin: 8,
  },
  offlineText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#f57c00',
  },
}); 

export const parallaxScrollViewStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 250,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: 'hidden',
  },
}); 

export const themedTextStyles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
}); 

export const collapsibleStyles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  content: {
    marginTop: 6,
    marginLeft: 24,
  },
}); 

export const helloWaveStyles = StyleSheet.create({
  text: {
    fontSize: 28,
    lineHeight: 32,
    marginTop: -6,
  },
}); 

export const homeScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
}); 

export const profileScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#666',
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuText: {
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 20,
    marginHorizontal: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 

export const profileTabStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  azureBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#0066CC',
    borderRadius: 12,
  },
  azureBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#666',
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuText: {
    fontSize: 16,
  },
  infoItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 20,
    marginHorizontal: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButtonDisabled: {
    opacity: 0.5,
  },
}); 

export const valuationsScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  list: {
    paddingBottom: 20,
  },
  valuationItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  address: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  details: {
    fontSize: 14,
    color: '#666',
  },
}); 

export const indexStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffeded',
    padding: 6,
    borderRadius: 4,
  },
  offlineText: {
    fontSize: 12,
    color: '#e74c3c',
    marginLeft: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 150,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  refreshButton: {
    backgroundColor: '#3498db',
  },
  clearButton: {
    backgroundColor: '#e74c3c',
  },
  retryButton: {
    backgroundColor: '#3498db',
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  templateCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  templateInfo: {
    marginLeft: 12,
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  templateId: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  templateDescription: {
    fontSize: 14,
    color: '#34495e',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
}); 

export const dashboardStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
}); 

export const exploreStyles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
}); 

export const valuationsTabStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  list: {
    paddingBottom: 20,
  },
  valuationItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  address: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  details: {
    fontSize: 14,
    color: '#666',
  },
}); 

export const syncStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 22,
  },
  summaryCard: {
    margin: 10,
    backgroundColor: '#fff',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 4,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 8,
  },
  progressCard: {
    margin: 10,
    backgroundColor: '#fff',
  },
  progressText: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 10,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  progressPercentage: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  resultCard: {
    margin: 10,
    backgroundColor: '#fff',
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 8,
  },
  resultMessage: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 10,
  },
  syncedDetails: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 5,
  },
  syncedText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  buttonContainer: {
    padding: 20,
    gap: 10,
  },
  syncButton: {
    backgroundColor: '#3498db',
  },
  refreshButton: {
    borderColor: '#3498db',
  },
}); 

export const notFoundStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
}); 

// Note: appointmentStyles is defined later in the file
// This style object will be updated to use appointmentStyles once it's defined
export const scheduledAppointmentsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBar: {
    margin: spacing.lg,
    elevation: 2,
    borderRadius: borderRadius.md,
  },
  listContainer: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: 80,
  },
  appointmentCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  appointmentHeader: commonStyles.row,
  icon: {
    marginRight: spacing.sm,
  },
  appointmentAddress: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  appointmentDetails: {
    marginTop: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  detailIcon: {
    marginRight: spacing.sm,
    width: spacing.lg,
  },
  detailText: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  loadingContainer: commonStyles.loadingContainer,
  loadingText: commonStyles.loadingText,
  errorContainer: commonStyles.errorContainer,
  errorText: commonStyles.errorText,
  retryButton: {
    marginTop: 10,
  },
  emptyContainer: commonStyles.emptyContainer,
  emptyText: commonStyles.emptyText,
  emptySubtext: commonStyles.emptySubtext,
  paginationContainer: {
    ...commonStyles.paginationContainer,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  paginationButton: {
    minWidth: 100,
  },
  paginationText: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
}); 

export const dynamicFieldRendererStyles = StyleSheet.create({
  // Main container
  fieldContainer: {
    marginBottom: 16,
  },
  /** Label + control on one row, vertically centered (when hideLabel is false). */
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  fieldControlInRow: {
    flex: 1,
    minWidth: 0,
  },
  labelInRow: {
    marginBottom: 0,
    flexShrink: 1,
    maxWidth: '42%',
  },
  
  // Label styles - controlled by hideLabel prop
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  labelError: {
    color: '#e74c3c',
  },
  required: {
    color: '#e74c3c',
  },
  
  // Input container and base input styles
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  /** Scaled visual size for checkbox/switch (layout space unchanged — use margins so rows don’t clip). */
  booleanSwitchWrapper: {
    transform: [{ scaleX: 1.6 }, { scaleY: 1.6 }],
    marginVertical: 12,
    marginLeft: 10,
    marginRight: 28,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  /** Integer qty-style fields: right-aligned, grouped display (see DynamicFieldRenderer number) */
  numberInput: {
    textAlign: 'right' as const,
  },
  textAreaInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  
  // Handwriting button
  handwritingButton: {
    marginLeft: 8,
    padding: 8,
  },
  
  // Picker styles
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  
  // Location buttons
  locationButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
  },
  locationButtonSelected: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  locationButtonText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  locationButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  
  // Error text
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
  
  // Photo section
  photoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#f0f4f7',
    borderWidth: 1,
    borderColor: '#4a90e2',
  },
  photoButtonText: {
    fontSize: 12,
    color: '#4a90e2',
    marginLeft: 4,
    fontWeight: '500',
  },
  
  // Currency input
  currencyContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  currencyPrefix: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '600',
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  currencyInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 0, // Remove border since container has it
    textAlign: 'right' as const,
  },
  
  // Combobox styles
  comboboxContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    minHeight: 48,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  dropdownButtonPlaceholder: {
    color: '#95a5a6',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 2,
    maxHeight: 200,
    elevation: 10,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#f8f9fa',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  dropdownItemTextSelected: {
    color: '#4a90e2',
    fontWeight: '600',
  },
  
  // Auto-suggest styles
  autoSuggestContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  suggestionsList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    maxHeight: 150,
    zIndex: 1001,
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  suggestionsContent: {
    maxHeight: 150,
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionItemText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  
  // Location group styles
  locationGroupContainer: {
    marginBottom: 8,
  },
  locationGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  locationGroupHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  locationGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  locationGroupButton: {
    minWidth: 80,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4a90e2',
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  locationGroupButtonSelected: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  locationGroupButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationGroupButtonText: {
    fontSize: 12,
    color: '#4a90e2',
    fontWeight: '500',
    marginTop: 4,
  },
  locationGroupButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  selectedLocationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fff8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27ae60',
  },
  selectedLocationText: {
    fontSize: 14,
    color: '#27ae60',
    marginLeft: 8,
    fontWeight: '500',
  },
  
  // Modal dropdown styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalDropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  modalDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalDropdownItemSelected: {
    backgroundColor: '#f8f9fa',
  },
  modalDropdownItemText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  modalDropdownItemTextSelected: {
    color: '#4a90e2',
    fontWeight: '600',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    maxHeight: 150,
    zIndex: 1001,
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  suggestionText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  radioGroupContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  radioGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  radioGroupRowLast: {
    borderBottomWidth: 0,
  },
  radioGroupRowSelected: {
    backgroundColor: '#f0f7ff',
  },
  radioGroupLabel: {
    flex: 1,
    fontSize: 15,
    color: '#2c3e50',
    marginLeft: 10,
  },
  radioGroupLabelSelected: {
    color: '#4a90e2',
    fontWeight: '600',
  },
  multiselectOuter: {
    width: '100%',
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingVertical: 4,
  },
  multiselectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  multiselectRowSelected: {
    backgroundColor: '#f0f7ff',
  },
  multiselectLabel: {
    fontSize: 15,
    color: '#2c3e50',
    marginLeft: 8,
    flex: 1,
  },
});

export const completedAppointmentsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  searchBar: {
    margin: 16,
    elevation: 2,
    borderRadius: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 80,
  },
  appointmentCard: {
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  appointmentAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  statusChip: {
    backgroundColor: '#2ecc71',
    borderRadius: 16,
  },
  statusChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#7f8c8d',
    flex: 1,
  },
  viewButton: {
    marginTop: 12,
    borderColor: '#4a90e2',
    borderRadius: 6,
  },
  buttonLabel: {
    color: '#4a90e2',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#4a90e2',
  },
  paginationButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  paginationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  paginationButtonTextDisabled: {
    color: '#7f8c8d',
  },
  paginationInfo: {
    fontSize: 14,
    color: '#7f8c8d',
  },
});

export const tasksTabStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  filterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 8,
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: '#4a90e2',
  },
  filterChipSelectedText: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  taskCard: {
    marginBottom: 14,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  taskCardBorder: {
    borderLeftWidth: 4,
  },
  cardContent: {
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  statusChip: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusChipCompleted: {
    backgroundColor: '#27ae60',
  },
  statusChipPending: {
    backgroundColor: '#f39c12',
  },
  statusChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    marginRight: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#7f8c8d',
    flex: 1,
  },
  notesPreview: {
    fontSize: 13,
    color: '#95a5a6',
    fontStyle: 'italic',
    marginTop: 4,
    marginLeft: 26,
  },
  viewButton: {
    marginTop: 14,
    borderColor: '#4a90e2',
    borderRadius: 8,
  },
  buttonLabel: {
    color: '#4a90e2',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  paginationInfo: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
});

export const taskDetailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 13,
    color: '#7f8c8d',
    flex: 0.4,
  },
  value: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 0.6,
    fontWeight: '500',
    textAlign: 'right',
  },
  valueMultiline: {
    textAlign: 'left',
    marginTop: 4,
  },
});

export const finaliseAppointmentsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  searchBar: {
    margin: 16,
    elevation: 2,
    borderRadius: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 80,
  },
  appointmentCard: {
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  appointmentAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  statusChip: {
    backgroundColor: '#f39c12',
    borderRadius: 16,
  },
  statusChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#7f8c8d',
    flex: 1,
  },
  viewButton: {
    marginTop: 12,
    borderColor: '#4a90e2',
    borderRadius: 6,
  },
  buttonLabel: {
    color: '#4a90e2',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#4a90e2',
  },
  paginationButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  paginationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  paginationButtonTextDisabled: {
    color: '#7f8c8d',
  },
  paginationInfo: {
    fontSize: 14,
    color: '#7f8c8d',
  },
}); 



// ============================================================================
// COMPREHENSIVE TYPOGRAPHY SYSTEM
// ============================================================================

export const textStyles = StyleSheet.create({
  // Display Text
  displayLarge: {
    fontSize: typography.xxxxxl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    lineHeight: typography.xxxxxl * typography.lineHeightTight,
  },
  displayMedium: {
    fontSize: typography.xxxxl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    lineHeight: typography.xxxxl * typography.lineHeightTight,
  },
  displaySmall: {
    fontSize: typography.xxxl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    lineHeight: typography.xxxl * typography.lineHeightTight,
  },

  // Headings
  h1: {
    fontSize: typography.xxxl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    lineHeight: typography.xxxl * typography.lineHeightTight,
  },
  h2: {
    fontSize: typography.xxl,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    lineHeight: typography.xxl * typography.lineHeightTight,
  },
  h3: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    lineHeight: typography.xl * typography.lineHeightNormal,
  },
  h4: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    lineHeight: typography.lg * typography.lineHeightNormal,
  },

  // Body Text
  bodyLarge: {
    fontSize: typography.lg,
    fontWeight: typography.normal,
    color: colors.textPrimary,
    lineHeight: typography.lg * typography.lineHeightNormal,
  },
  bodyMedium: {
    fontSize: typography.base,
    fontWeight: typography.normal,
    color: colors.textPrimary,
    lineHeight: typography.base * typography.lineHeightNormal,
  },
  bodySmall: {
    fontSize: typography.sm,
    fontWeight: typography.normal,
    color: colors.textPrimary,
    lineHeight: typography.sm * typography.lineHeightNormal,
  },

  // Caption Text
  caption: {
    fontSize: typography.sm,
    fontWeight: typography.normal,
    color: colors.textSecondary,
    lineHeight: typography.sm * typography.lineHeightNormal,
  },
  captionSmall: {
    fontSize: typography.xs,
    fontWeight: typography.normal,
    color: colors.textMuted,
    lineHeight: typography.xs * typography.lineHeightNormal,
  },

  // Label Text
  labelLarge: {
    fontSize: typography.lg,
    fontWeight: typography.medium,
    color: colors.textPrimary,
    lineHeight: typography.lg * typography.lineHeightNormal,
  },
  labelMedium: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.textPrimary,
    lineHeight: typography.base * typography.lineHeightNormal,
  },
  labelSmall: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.textPrimary,
    lineHeight: typography.sm * typography.lineHeightNormal,
  },

  // Button Text
  buttonLarge: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.white,
    lineHeight: typography.lg * typography.lineHeightTight,
  },
  buttonMedium: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.white,
    lineHeight: typography.base * typography.lineHeightTight,
  },
  buttonSmall: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.white,
    lineHeight: typography.sm * typography.lineHeightTight,
  },
});

// ============================================================================
// CONSOLIDATED APPOINTMENT STYLES
// ============================================================================

export const appointmentStyles = StyleSheet.create({
  // Common appointment styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBar: {
    margin: spacing.lg,
    elevation: 2,
    borderRadius: borderRadius.md,
  },
  listContainer: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: 80,
  },
  appointmentCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  appointmentHeader: commonStyles.row,
  icon: {
    marginRight: spacing.sm,
  },
  appointmentAddress: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  appointmentDetails: {
    marginTop: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  detailIcon: {
    marginRight: spacing.sm,
    width: spacing.lg,
  },
  detailText: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  statusChip: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusChipText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.white,
  },
  viewButton: {
    marginTop: spacing.md,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  buttonLabel: {
    color: colors.primary,
    fontSize: typography.base,
    fontWeight: typography.semibold,
  },
  loadingContainer: commonStyles.loadingContainer,
  loadingText: commonStyles.loadingText,
  errorContainer: commonStyles.errorContainer,
  errorText: commonStyles.errorText,
  emptyContainer: commonStyles.emptyContainer,
  emptyText: commonStyles.emptyText,
  paginationContainer: {
    ...commonStyles.paginationContainer,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  paginationButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
  },
  paginationButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  paginationButtonText: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.semibold,
  },
  paginationButtonTextDisabled: {
    color: colors.textSecondary,
  },
  paginationInfo: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
});

export const predefinedItemsListStyles = StyleSheet.create({
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  fieldLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  fieldLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#7f8c8d',
  },

  // Card and container styles
  card: {
    flex: 1,
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  predefinedContent: {
    padding: 0,
    paddingVertical: 8,
  },
  predefinedList: {
    flex: 1,
    minHeight: 200,
  },
  predefinedListContent: {
    paddingHorizontal: 16,
  },

  // Scroll indicators
  scrollIndicator: {
    alignItems: 'center',
    paddingVertical: 4,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  scrollHint: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 4,
  },

  // Dynamic field styles
  dynamicFieldContainer: {
    marginBottom: 0,
  },
  /** Non-grouped templates: label beside control (web table row parity) */
  dynamicFieldRowSideBySide: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  dynamicFieldRowSideBySideMultiline: {
    alignItems: 'flex-start',
  },
  /** Label column: fixed share of row width; text right-aligned against controls (web table / form grid). */
  dynamicFieldLabelLeft: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34495e',
    width: '40%',
    paddingRight: 10,
    flexShrink: 0,
    textAlign: 'right',
  },
  dynamicFieldControlWrap: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  /**
   * Full-width row: [label 20%][control flex][label 20%][control flex] so two fields share one line
   * with labels/controls aligned to the same grid (not 40% of each half-cell).
   */
  dynamicFieldGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  dynamicFieldGridLabel: {
    width: '20%',
    paddingRight: 8,
    flexShrink: 0,
    alignSelf: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#34495e',
    textAlign: 'right',
  },
  dynamicFieldGridControlFlex: {
    flex: 1,
    minWidth: 0,
  },
  dynamicFieldGridFullBleed: {
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  detailItem: {
    flex: 1,
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editInput: {
    backgroundColor: '#fff',
    height: 36,
    fontSize: 14,
  },
  editInputMultiline: {
    backgroundColor: '#fff',
    fontSize: 14,
    minHeight: 50,
  },
  notesSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },

  /** Web-style inline notes under SelectedAnswer (grey callout + caret) */
  notesCalloutWrap: {
    marginTop: 6,
    width: '100%',
  },
  notesCalloutArrowRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 28,
    marginBottom: -1,
  },
  notesCalloutArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#dfe3e8',
  },
  notesCalloutBox: {
    backgroundColor: '#f4f6f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfe3e8',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  notesCalloutInput: {
    minHeight: 64,
    fontSize: 15,
    color: '#2c3e50',
    textAlignVertical: 'top' as const,
    padding: 0,
  },
  notesStandaloneIconColumn: {
    justifyContent: 'flex-start',
    paddingTop: 10,
    paddingLeft: 6,
  },

  // Photo section styles
  photoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#f0f4f7',
    borderWidth: 1,
    borderColor: '#4a90e2',
  },
  photoButtonText: {
    fontSize: 12,
    color: '#4a90e2',
    marginLeft: 4,
    fontWeight: '500',
  },

  // Group styles
  groupContainer: {
    marginBottom: 4,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#e8f4f8',
    borderBottomWidth: 1,
    borderBottomColor: '#d0e8f0',
  },
  groupHeaderAlt: {
    backgroundColor: '#f0f8f0',
  },
  groupHeaderExpanded: {
    borderBottomColor: '#4a90e2',
    borderBottomWidth: 2,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  groupIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    backgroundColor: '#4a90e2',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  groupItems: {
    backgroundColor: '#f8f9fa',
  },

  // Secondary group styles
  secondaryGroupContainer: {
    marginBottom: 2,
  },
  secondaryGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#f0f4f7',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e8f0',
    marginLeft: 8,
  },
  secondaryGroupTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495e',
    flex: 1,
  },
  secondaryCountBadge: {
    backgroundColor: '#6c757d',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginRight: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  secondaryGroupItems: {
    backgroundColor: '#f8f9fa',
    marginLeft: 8,
  },

  // Item styles
  accordionContainer: {
    marginBottom: 2,
  },
  predefinedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  predefinedItemAlt: {
    backgroundColor: '#f9f9f9',
  },
  predefinedItemExpanded: {
    borderBottomColor: '#4a90e2',
    borderBottomWidth: 2,
  },
  predefinedItemAutoSaved: {
    backgroundColor: '#f0f8f0',
  },
  groupItemRow: {
    paddingLeft: 24,
    backgroundColor: '#fafafa',
  },
  secondaryGroupItemRow: {
    paddingLeft: 32,
    backgroundColor: '#f5f6fa',
  },

  // Item content styles
  itemSummaryContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  itemSummaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 2,
  },
  itemValueText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '400',
  },
  indicatorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteIconButton: {
    marginRight: 4,
    padding: 2,
  },

  // Expanded content styles
  expandedContent: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  detailsContainer: {
    padding: 16,
  },
  detailsGrid: {
    marginBottom: 16,
  },

  // Action buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  duplicateButton: {
    backgroundColor: '#f0f4f7',
    borderColor: '#4a90e2',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  duplicateButtonText: {
    color: '#4a90e2',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
    textAlign: 'center',
  },
});