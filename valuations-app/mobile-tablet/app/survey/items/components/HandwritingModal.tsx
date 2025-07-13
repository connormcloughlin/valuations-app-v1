import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import Svg, { Path } from 'react-native-svg';
import { HandwritingModalProps } from './types';
import { colors, spacing, borderRadius, typography, commonStyles } from '../../../GlobalStyles';

export default function HandwritingModal({
  visible,
  currentField,
  paths,
  currentPath,
  strokeColor,
  recognizedText,
  onClose,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onClearCanvas,
  onRecognizeHandwriting,
  onConfirmHandwriting
}: HandwritingModalProps) {

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Handwriting Recognition</Text>
            <IconButton
              icon="close"
              size={20}
              onPress={onClose}
            />
          </View>
          
          <View style={styles.canvasContainer}>
            <View
              style={styles.canvas}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <Svg height="100%" width="100%">
                {paths.map((item, index) => (
                  <Path
                    key={index}
                    d={item.path}
                    stroke={item.color}
                    strokeWidth={3}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    fill="none"
                  />
                ))}
                {currentPath && (
                  <Path
                    d={currentPath}
                    stroke={strokeColor}
                    strokeWidth={3}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    fill="none"
                  />
                )}
              </Svg>
            </View>
          </View>
          
          <View style={styles.canvasButtons}>
            <Button mode="outlined" onPress={onClearCanvas}>Clear</Button>
            <Button mode="contained" onPress={onRecognizeHandwriting}>Recognize</Button>
          </View>
          
          {recognizedText && (
            <View style={styles.recognizedTextContainer}>
              <Text style={styles.recognizedTextLabel}>Recognized Text:</Text>
              <Text style={styles.recognizedText}>{recognizedText}</Text>
            </View>
          )}
          
          <Button
            mode="contained"
            onPress={onConfirmHandwriting}
            disabled={!recognizedText}
          >
            Confirm
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: commonStyles.modalContainer,
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  modalHeader: commonStyles.modalHeader,
  modalTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  canvasContainer: {
    width: '100%',
    height: 300,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  canvas: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray[50],
  },
  canvasButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recognizedTextContainer: {
    backgroundColor: colors.gray[100],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  recognizedTextLabel: {
    fontSize: typography.base,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  recognizedText: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
}); 