import { useState } from 'react';
import { View, Text, Modal, Pressable, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { reviewsApi } from '../api';
import { styles } from '../styles/components/ReviewModal.styles';

interface Props {
  visible: boolean;
  restaurantId: string;
  restaurantName: string;
  orderId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export function ReviewModal({
  visible,
  restaurantId,
  restaurantName,
  orderId,
  onClose,
  onSubmitted,
}: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setRating(5);
    setComment('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await reviewsApi.create(restaurantId, { orderId, rating, comment });
      reset();
      onSubmitted();
    } catch (err) {
      Alert.alert(
        'Không gửi được đánh giá',
        err instanceof Error ? err.message : 'Thử lại sau',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.modalBg} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Đánh giá {restaurantName}</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setRating(n)}>
                <MaterialIcons
                  name={n <= rating ? 'star' : 'star-border'}
                  size={36}
                  color={Colors.yellow}
                />
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Món ăn thế nào, giao hàng ra sao?"
            placeholderTextColor={Colors.textLight}
            multiline
            numberOfLines={4}
            maxLength={1000}
            value={comment}
            onChangeText={setComment}
          />
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={submit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitText}>Gửi đánh giá</Text>
            )}
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

