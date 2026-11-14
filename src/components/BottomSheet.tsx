import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** 抽屉最大高度占屏幕高度的比例 */
  maxHeightRatio?: number;
}

/** 通用底部抽屉：半透明遮罩 + 圆角白色面板 + 顶部抓手，点击遮罩关闭。 */
export function BottomSheet({ visible, onClose, children, maxHeightRatio = 0.85 }: Props) {
  const [slide] = useState(() => new Animated.Value(0));
  const sheetHeight = Dimensions.get('window').height * maxHeightRatio;

  useEffect(() => {
    if (visible) {
      slide.setValue(0);
      Animated.timing(slide, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [visible, slide]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            {
              maxHeight: sheetHeight,
              transform: [
                {
                  translateY: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [sheetHeight, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  // 内容区：内容少时随内容收缩，内容多时被 maxHeight 截断并由内部滚动视图滚动
  content: { flexShrink: 1, overflow: 'hidden' },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.textTertiary, opacity: 0.5 },
});
