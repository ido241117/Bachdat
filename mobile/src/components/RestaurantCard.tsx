import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Restaurant } from '../data/restaurants';

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
        <View style={styles.ratingBadge}>
          <MaterialIcons name="star" size={14} color={Colors.yellow} />
          <Text style={styles.ratingText}>{restaurant.rating}</Text>
        </View>
        {restaurant.freeship && (
          <View style={styles.freeshipBadge}>
            <Text style={styles.freeshipText}>Freeship</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <Text style={styles.priceLevel}>{restaurant.priceLevel}</Text>
        </View>
        <Text style={styles.cuisine} numberOfLines={1}>
          {restaurant.cuisine}
        </Text>
        <View style={styles.metaRow}>
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrap: {
    height: 192,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  freeshipBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeshipText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  info: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  priceLevel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  cuisine: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.secondary,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
  },
});
