import { StyleSheet } from 'react-native';
import { Colors } from '../colors';

const BANNER_WIDTH = 280;

export const styles = StyleSheet.create({
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
  emptySaved: {
    textAlign: 'center',
    color: Colors.onSurfaceVariant,
    paddingVertical: 24,
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
