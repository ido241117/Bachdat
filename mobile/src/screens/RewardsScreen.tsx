import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ImageBackground, ActivityIndicator } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import {
  VOUCHER_FILTERS,
  Voucher,
  PromoBanner,
  Mission,
} from '../data/vouchers';
import { formatNextTier, formatTierLabel } from '../api/format';
import { rewardsApi, userApi, vouchersApi } from '../api';
import { mapBanner, mapMission, mapVoucher } from '../api/mappers';
import { TopAppBar } from '../components/TopAppBar';
import { useAuth } from '../context/AuthContext';
import { styles } from '../styles/screens/RewardsScreen.styles';

const FILTER_MAP: Record<string, string | undefined> = {
  'Tất cả': undefined,
  Freeship: 'freeship',
  'Giảm giá món': 'discount',
  'Thanh toán': 'payment',
  'Đã lưu': undefined,
};

function VoucherCard({ voucher, onSave }: { voucher: Voucher; onSave: (id: string) => void }) {
  const badgeStyles = {
    freeship: { bg: 'rgba(216,57,0,0.1)', color: Colors.primary },
    discount: { bg: Colors.primary, color: Colors.white },
    ewallet: { bg: 'rgba(115,117,117,0.1)', color: Colors.tertiary },
  };
  const badge = badgeStyles[voucher.badgeType];

  const expiryStyles = {
    normal: { bg: 'rgba(173,44,0,0.1)', color: Colors.primary },
    urgent: { bg: Colors.errorContainer, color: Colors.onErrorContainer },
    date: { bg: Colors.surfaceContainerHigh, color: Colors.onSurfaceVariant },
  };
  const expiry = expiryStyles[voucher.expiryType];

  return (
    <View style={styles.voucherCard}>
      <View style={[styles.voucherLeft, { backgroundColor: badge.bg }]}>
        {voucher.discountAmount ? (
          <Text style={[styles.discountAmount, { color: badge.color }]}>
            {voucher.discountAmount}
          </Text>
        ) : (
          <MaterialIcons
            name={
              voucher.badgeType === 'freeship'
                ? 'local-shipping'
                : 'account-balance-wallet'
            }
            size={32}
            color={badge.color}
          />
        )}
        <Text style={[styles.voucherBadge, { color: badge.color }]}>{voucher.badge}</Text>
      </View>
      <View style={styles.voucherRight}>
        <Text style={styles.voucherTitle}>{voucher.title}</Text>
        <Text style={styles.voucherSubtitle}>{voucher.subtitle}</Text>
        <View style={styles.voucherFooter}>
          <View style={[styles.expiryBadge, { backgroundColor: expiry.bg }]}>
            <Text style={[styles.expiryText, { color: expiry.color }]}>{voucher.expiry}</Text>
          </View>
          <TouchableOpacity onPress={() => onSave(voucher.id)}>
            <Text style={styles.voucherAction}>{voucher.action}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={[styles.punchHole, styles.punchLeft]} />
      <View style={[styles.punchHole, styles.punchRight]} />
    </View>
  );
}

export function RewardsScreen({ onBack }: { onBack?: () => void }) {
  const { ready } = useAuth();
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [savedVouchers, setSavedVouchers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loyalty, setLoyalty] = useState({
    tier: 'Thành viên Vàng',
    points: 0,
    nextTier: 'Kim Cương',
    pointsToNext: 0,
    progress: 0,
  });
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const filter = FILTER_MAP[activeFilter];
        const isSavedView = activeFilter === 'Đã lưu';
        const [wallet, voucherList, missionList, savedList] = await Promise.all([
          rewardsApi.wallet(),
          isSavedView ? Promise.resolve([]) : vouchersApi.list(filter),
          rewardsApi.missions(),
          userApi.savedVouchers().catch(() => []),
        ]);
        if (cancelled) return;
        const savedIds = savedList.map((v) => v._id);
        setSavedVouchers(savedIds);
        setLoyalty({
          tier: formatTierLabel(wallet.tier, wallet.tierLabel),
          points: wallet.points,
          nextTier: formatNextTier(wallet.nextTier || 'diamond'),
          pointsToNext: wallet.pointsToNext,
          progress: wallet.progress / 100,
        });
        setBanners(wallet.banners.map(mapBanner));
        const displayList = isSavedView ? savedList : voucherList;
        setVouchers(
          displayList.map((v) => mapVoucher(v, savedIds.includes(v._id))),
        );
        setMissions(missionList.map(mapMission));
      } catch (err) {
        console.warn('Rewards load failed', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, activeFilter]);

  const handleSave = async (id: string) => {
    try {
      await vouchersApi.save(id);
      setSavedVouchers((prev) => [...prev, id]);
      setVouchers((prev) =>
        prev.map((v) => (v.id === id ? { ...v, action: 'Đã Lưu' } : v)),
      );
    } catch (err) {
      console.warn('Save voucher failed', err);
    }
  };

  return (
    <View style={styles.container}>
      <TopAppBar
        variant="title"
        title="Ưu đãi & Điểm thưởng"
        onBack={onBack}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.loyaltyCard}>
          <MaterialIcons
            name="stars"
            size={80}
            color="rgba(255,255,255,0.2)"
            style={styles.loyaltyBgIcon}
          />
          <View style={styles.loyaltyContent}>
            <View style={styles.loyaltyTier}>
              <MaterialIcons name="verified" size={20} color={Colors.white} />
              <Text style={styles.loyaltyTierText}>{loyalty.tier.toUpperCase()}</Text>
            </View>
            <View style={styles.pointsRow}>
              <Text style={styles.pointsValue}>
                {loyalty.points.toLocaleString('vi-VN')}
              </Text>
              <Text style={styles.pointsLabel}>Điểm</Text>
            </View>
            <Text style={styles.pointsHint}>
              Còn {loyalty.pointsToNext} điểm để lên hạng {loyalty.nextTier}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${loyalty.progress * 100}%` }]}
              />
            </View>
          </View>
        </View>

        <View style={styles.promoSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Khuyến mãi cực hot</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.promoScroll}
          >
            {banners.map((banner) => (
              <ImageBackground
                key={banner.id}
                source={{ uri: banner.image }}
                style={styles.promoBanner}
                imageStyle={styles.promoBannerImage}
              >
                <View style={styles.promoOverlay}>
                  <Text style={styles.promoTitle}>{banner.title}</Text>
                </View>
              </ImageBackground>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {VOUCHER_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                activeFilter === filter && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter && styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.voucherList}>
          {vouchers.length === 0 && activeFilter === 'Đã lưu' ? (
            <Text style={styles.emptySaved}>Bạn chưa lưu voucher nào</Text>
          ) : (
            vouchers.map((voucher) => (
              <VoucherCard
                key={voucher.id}
                voucher={voucher}
                onSave={handleSave}
              />
            ))
          )}
        </View>

        <View style={styles.missionsSection}>
          <Text style={styles.sectionTitle}>Săn thêm điểm thưởng</Text>
          <View style={styles.missionsGrid}>
            {missions.filter((m) => m.wide).map((mission) => (
              <View key={mission.id} style={styles.missionWide}>
                <View style={styles.missionIconWrap}>
                  <MaterialCommunityIcons name="food" size={22} color={Colors.primary} />
                </View>
                <View style={styles.missionInfo}>
                  <Text style={styles.missionTitle}>{mission.title}</Text>
                  <Text style={styles.missionSubtitle}>{mission.subtitle}</Text>
                </View>
                <Text style={styles.missionPoints}>{mission.points}</Text>
              </View>
            ))}
            <View style={styles.missionRow}>
              {missions.filter((m) => !m.wide).map((mission) => (
                <View key={mission.id} style={styles.missionSmall}>
                  <MaterialIcons
                    name={mission.icon === 'share' ? 'share' : 'star-rate'}
                    size={48}
                    color="rgba(173,44,0,0.2)"
                    style={styles.missionBgIcon}
                  />
                  <Text style={styles.missionTitle}>{mission.title}</Text>
                  <Text style={styles.missionSubtitle}>{mission.subtitle}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      )}
    </View>
  );
}

