import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Plus, MapPin, Edit2, Trash2, X, Map } from "lucide-react-native";
import { useTheme } from "../../theme";
import {
  useCustomerAddresses,
  useAddCustomerAddress,
  useUpdateCustomerAddress,
  useDeleteCustomerAddress,
} from "../../hooks/useCustomer";
import { CustomerStackParamList } from "../../types/navigation.types";
import { AppHeader } from "../../components/AppHeader";
import { AppLoader } from "../../components/AppLoader";
import { AppCard } from "../../components/AppCard";
import { AppButton } from "../../components/AppButton";
import { AppInput } from "../../components/AppInput";

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList, "AddressBook">;
type RouteProps = RouteProp<CustomerStackParamList, "AddressBook">;

interface AddressFormState {
  id?: string;
  label: string;
  addressText: string;
  lat: string;
  lng: string;
}

export const AddressBookScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const onSelectAddress = route.params?.onSelectAddress;

  const { data: addresses = [], isLoading } = useCustomerAddresses();
  const addAddressMutation = useAddCustomerAddress();
  const updateAddressMutation = useUpdateCustomerAddress();
  const deleteAddressMutation = useDeleteCustomerAddress();

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<AddressFormState>({
    label: "",
    addressText: "",
    lat: "28.6139", // Default coordinates if needed
    lng: "77.2090",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const validate = (currentForm: AddressFormState) => {
    const newErrors: Record<string, string> = {};
    if (!currentForm.label.trim()) newErrors.label = "Label is required";
    if (!currentForm.addressText.trim()) newErrors.addressText = "Address text is required";
    if (!currentForm.lat.trim()) newErrors.lat = "Latitude is required";
    if (isNaN(Number(currentForm.lat))) newErrors.lat = "Latitude must be a valid number";
    if (!currentForm.lng.trim()) newErrors.lng = "Longitude is required";
    if (isNaN(Number(currentForm.lng))) newErrors.lng = "Longitude must be a valid number";
    return newErrors;
  };

  const handleOpenAdd = () => {
    setForm({
      label: "",
      addressText: "",
      lat: "28.6139",
      lng: "77.2090",
    });
    setErrors({});
    setSubmitAttempted(false);
    setModalVisible(true);
  };

  const handleOpenEdit = (item: any) => {
    setForm({
      id: item.id,
      label: item.label,
      addressText: item.addressText,
      lat: String(item.lat),
      lng: String(item.lng),
    });
    setErrors({});
    setSubmitAttempted(false);
    setModalVisible(true);
  };

  const handleSave = async () => {
    setSubmitAttempted(true);
    const newErrors = validate(form);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      const payload = {
        label: form.label,
        addressText: form.addressText,
        lat: Number(form.lat),
        lng: Number(form.lng),
      };

      if (form.id) {
        await updateAddressMutation.mutateAsync({ id: form.id, payload });
        Alert.alert("Success", "Address updated successfully.");
      } else {
        await addAddressMutation.mutateAsync(payload);
        Alert.alert("Success", "Address saved successfully.");
      }
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to save address");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to remove this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAddressMutation.mutateAsync(id);
              Alert.alert("Deleted", "Address removed successfully.");
            } catch (error: any) {
              Alert.alert("Error", error?.message || "Failed to delete address");
            }
          },
        },
      ]
    );
  };

  const isFormValid = !form.label.trim() || !form.addressText.trim() || !form.lat.trim() || !form.lng.trim();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader showBack onBackPress={() => navigation.goBack()} title="Address Book" />

      {isLoading ? (
        <AppLoader message="Retrieving addresses..." />
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <AppCard
              style={styles.addressCard}
              onPress={() => {
                if (onSelectAddress) {
                  onSelectAddress(item.addressText, item.lat, item.lng);
                  navigation.goBack();
                }
              }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.labelWrapper}>
                  <MapPin size={16} color={theme.colors.primary} />
                  <Text style={[styles.addressLabel, { color: theme.colors.text }]}>
                    {item.label}
                  </Text>
                </View>
                <View style={styles.actionButtons}>
                  <Pressable onPress={() => handleOpenEdit(item)} style={styles.iconBtn}>
                    <Edit2 size={16} color={theme.colors.textMuted} />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
                    <Trash2 size={16} color={theme.colors.danger} />
                  </Pressable>
                </View>
              </View>

              <Text style={[styles.addressText, { color: theme.colors.textMuted }]}>
                {item.addressText}
              </Text>

              <View style={styles.coordsRow}>
                <Map size={12} color={theme.colors.textLight} />
                <Text style={[styles.coordsText, { color: theme.colors.textLight }]}>
                  Lat: {item.lat}, Lng: {item.lng}
                </Text>
              </View>
            </AppCard>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MapPin size={48} color={theme.colors.textLight} />
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                No saved addresses yet.
              </Text>
            </View>
          }
        />
      )}

      <View style={styles.footer}>
        <AppButton
          title="Add New Address"
          onPress={handleOpenAdd}
          icon={<Plus size={18} color="#ffffff" style={{ marginRight: 6 }} />}
        />
      </View>

      {/* Add/Edit Address Form Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.borderLight }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {form.id ? "Edit Address" : "Add Address"}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={theme.colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              {/* Label Field */}
              <View style={styles.fieldContainer}>
                <View style={styles.labelRow}>
                  <Text style={[styles.formLabel, { color: theme.colors.textMuted }]}>Label</Text>
                  <Text style={{ color: theme.colors.danger, fontWeight: "bold" }}> *</Text>
                </View>
                <AppInput
                  placeholder="e.g. Home, Office, Parents"
                  value={form.label}
                  onChangeText={(val) => {
                    setForm((prev) => ({ ...prev, label: val }));
                    if (errors.label) setErrors((prev) => ({ ...prev, label: "" }));
                  }}
                />
                {submitAttempted && errors.label ? (
                  <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.label}</Text>
                ) : null}
              </View>

              {/* Address Text Field */}
              <View style={styles.fieldContainer}>
                <View style={styles.labelRow}>
                  <Text style={[styles.formLabel, { color: theme.colors.textMuted }]}>Address Text</Text>
                  <Text style={{ color: theme.colors.danger, fontWeight: "bold" }}> *</Text>
                </View>
                <AppInput
                  placeholder="Enter full address details"
                  value={form.addressText}
                  onChangeText={(val) => {
                    setForm((prev) => ({ ...prev, addressText: val }));
                    if (errors.addressText) setErrors((prev) => ({ ...prev, addressText: "" }));
                  }}
                  multiline
                  numberOfLines={3}
                />
                {submitAttempted && errors.addressText ? (
                  <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.addressText}</Text>
                ) : null}
              </View>

              {/* Latitude Field */}
              <View style={styles.fieldContainer}>
                <View style={styles.labelRow}>
                  <Text style={[styles.formLabel, { color: theme.colors.textMuted }]}>Latitude</Text>
                  <Text style={{ color: theme.colors.danger, fontWeight: "bold" }}> *</Text>
                </View>
                <AppInput
                  placeholder="e.g. 28.6139"
                  value={form.lat}
                  onChangeText={(val) => {
                    setForm((prev) => ({ ...prev, lat: val }));
                    if (errors.lat) setErrors((prev) => ({ ...prev, lat: "" }));
                  }}
                  keyboardType="numeric"
                />
                {submitAttempted && errors.lat ? (
                  <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.lat}</Text>
                ) : null}
              </View>

              {/* Longitude Field */}
              <View style={styles.fieldContainer}>
                <View style={styles.labelRow}>
                  <Text style={[styles.formLabel, { color: theme.colors.textMuted }]}>Longitude</Text>
                  <Text style={{ color: theme.colors.danger, fontWeight: "bold" }}> *</Text>
                </View>
                <AppInput
                  placeholder="e.g. 77.2090"
                  value={form.lng}
                  onChangeText={(val) => {
                    setForm((prev) => ({ ...prev, lng: val }));
                    if (errors.lng) setErrors((prev) => ({ ...prev, lng: "" }));
                  }}
                  keyboardType="numeric"
                />
                {submitAttempted && errors.lng ? (
                  <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.lng}</Text>
                ) : null}
              </View>

              <AppButton
                title={form.id ? "Update Address" : "Save Address"}
                onPress={handleSave}
                disabled={isFormValid}
                style={{ marginTop: 16 }}
                loading={addAddressMutation.isPending || updateAddressMutation.isPending}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  addressCard: {
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  labelWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  addressText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  coordsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  coordsText: {
    fontSize: 11,
    fontWeight: "500",
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "transparent",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 4,
  },
  modalForm: {
    padding: 16,
    paddingBottom: 40,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
});
