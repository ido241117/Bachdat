import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import {
  VOUCHER_FILTERS,
  Voucher,
  PromoBanner,
  Mission,
} from '../data/vouchers';
import { formatNextTier, formatTierLabel } from '../api/format';
import { rewardsApi, vouchersApi } from '../api';
import { mapBanner, mapMission, mapVoucher } from '../api/mappers';
import { TopAppBar } from '../components/TopAppBar';
import { useAuth } from '../context/AuthContext';

const BANNER_WIDTH = 280;

const FILTER_MAP: Record<string, string | undefined> = {
  'Tất cả': undefined,
  Freeship: 'freeship',
  'Giảm giá món': 'discount',
  'Thanh toán': 'payment',
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

export function RewardsScreen() {
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
        const [wallet, voucherList, missionList] = await Promise.all([
          rewardsApi.wallet(),
          vouchersApi.list(filter),
          rewardsApi.missions(),
        ]);
        if (cancelled) return;
        setLoyalty({
          tier: formatTierLabel(wallet.tier, wallet.tierLabel),
          points: wallet.points,
          nextTier: formatNextTier(wallet.nextTier || 'diamond'),
          pointsToNext: wallet.pointsToNext,
          progress: wallet.progress / 100,
        });
        setBanners(wallet.banners.map(mapBanner));
        setVouchers(
          voucherList.map((v) => mapVoucher(v, savedVouchers.includes(v._id))),
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
      <TopAppBar showMenu />

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
          {vouchers.map((voucher) => (
            <VoucherCard
              key={voucher.id}
              voucher={voucher}
              onSave={handleSave}
            />
          ))}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: 24,
  },
  loyaltyCard: {
    margin: 16,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  loyaltyBgIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  loyaltyContent: {
    zIndex: 1,
  },
  loyaltyTier: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  loyaltyTierText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
  },
  pointsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  pointsHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    marginTop: 8,
  },
  progressBar: {
    marginTop: 24,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 999,
  },
  promoSection: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  promoScroll: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 8,
  },
  promoBanner: {
    width: BANNER_WIDTH,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(231,189,178,0.3)',
  },
  promoBannerImage: {
    borderRadius: 12,
  },
  promoOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  promoTitle: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.secondaryContainer,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSecondaryContainer,
  },
  filterTextActive: {
    color: Colors.white,
  },
  voucherList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  voucherCard: {
    flexDirection: 'row',
    height: 96,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(231,189,178,0.3)',
    position: 'relative',
  },
  voucherLeft: {
    width: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.outlineVariant,
    borderStyle: 'dashed',
  },
  discountAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  voucherBadge: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  voucherRight: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  voucherTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  voucherSubtitle: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  voucherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  expiryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  expiryText: {
    fontSize: 10,
  },
  voucherAction: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  punchHole: {
    position: 'absolute',
    top: '50%',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    marginTop: -8,
  },
  punchLeft: {
    left: -8,
  },
  punchRight: {
    right: -8,
  },
  missionsSection: {
    paddingHorizontal: 16,
    marginTop: 32,
    paddingBottom: 16,
  },
  missionsGrid: {
    marginTop: 16,
    gap: 16,
  },
  missionWide: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(223,224,224,0.3)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(231,189,178,0.2)',
  },
  missionIconWrap: {
    backgroundColor: 'rgba(173,44,0,0.1)',
    padding: 8,
    borderRadius: 8,
  },
  missionInfo: {
    flex: 1,
  },
  missionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  missionSubtitle: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  missionPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  missionRow: {
    flexDirection: 'row',
    gap: 16,
  },
  missionSmall: {
    flex: 1,
    height: 128,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(231,189,178,0.2)',
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  missionBgIcon: {
    position: 'absolute',
    right: -8,
    bottom: -8,
  },
});
