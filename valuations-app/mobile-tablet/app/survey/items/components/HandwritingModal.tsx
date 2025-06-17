import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import Svg, { Path } from 'react-native-svg';
import { HandwritingModalProps } from './types';

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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
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
  canvasContainer: {
    width: '100%',
    height: 300,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  canvas: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f9f9f9',
  },
  canvasButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recognizedTextContainer: {
    backgroundColor: '#f0f4f7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  recognizedTextLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  recognizedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
}); 