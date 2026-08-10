import { MapAddressPicker } from '../components/MapAddressPicker';
import type { PickedAddress } from '../components/AddressSearchModal';
import { useDeliveryLocation } from '../context/DeliveryLocationContext';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api';

type Props = {
  onBack: () => void;
  initial?: { lat: number; lng: number };
  /** Khi true + đã login: lưu vào địa chỉ đã lưu */
  saveToAccount?: boolean;
};

export function SelectAddressScreen({
  onBack,
  initial,
  saveToAccount = false,
}: Props) {
  const { user } = useAuth();
  const { location, setLocation } = useDeliveryLocation();

  const handleConfirm = async (picked: PickedAddress) => {
    await setLocation({
      label: picked.label,
      fullAddress: picked.fullAddress,
      lat: picked.lat,
      lng: picked.lng,
    });

    if (saveToAccount && user) {
      try {
        const saved = await userApi.addAddress({
          label: picked.label,
          fullAddress: picked.fullAddress,
          lat: picked.lat,
          lng: picked.lng,
          isDefault: true,
        });
        await setLocation({
          label: saved.label,
          fullAddress: saved.fullAddress,
          lat: saved.lat,
          lng: saved.lng,
          addressId: saved._id,
        });
      } catch {
        // Local location already set
      }
    }

    onBack();
  };

  return (
    <MapAddressPicker
      asModal={false}
      visible
      title="Chọn địa chỉ"
      onClose={onBack}
      onConfirm={handleConfirm}
      autoLocate
      initial={
        initial ||
        (location
          ? { lat: location.lat, lng: location.lng }
          : undefined)
      }
    />
  );
}
