import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Restaurant } from '../data/restaurants';
import { styles } from '../styles/components/RestaurantCard.styles';

interface Props {
  restaurant: Restaurant;
  onPress: (restaurant: Restaurant) => void;
}

export function RestaurantCard({ restaurant, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(restaurant)}
      activeOpacity={0.95}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: restaurant.image }} style={styles.image} />
        {restaurant.popular && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>Hot</Text>
          </View>
        )}
        {restaurant.freeship && (
          <View style={styles.freeshipBadge}>
            <Text style={styles.freeshipText}>Ship 0đ</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {restaurant.name}
        </Text>
        {restaurant.tags.length > 0 && (
          <View style={styles.tagRow}>
            {restaurant.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagChipText} numberOfLines={1}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialIcons name="star" size={14} color={Colors.yellow} />
            <Text style={styles.metaText}>
              {restaurant.rating}
              {restaurant.reviewCount ? ` (${restaurant.reviewCount})` : ''}
            </Text>
          </View>
          <View style={styles.dot} />
          <View style={styles.metaItem}>
            <MaterialIcons name="schedule" size={14} color={Colors.secondary} />
            <Text style={styles.metaText}>{restaurant.deliveryTime}</Text>
          </View>
          <View style={styles.dot} />
          <View style={styles.metaItem}>
            <MaterialIcons name="near-me" size={14} color={Colors.secondary} />
            <Text style={styles.metaText}>{restaurant.distance}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

