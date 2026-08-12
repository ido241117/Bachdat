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

