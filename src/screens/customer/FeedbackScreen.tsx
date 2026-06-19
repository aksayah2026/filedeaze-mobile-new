import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Star, MessageSquare } from "lucide-react-native";
import { useTheme } from "../../theme";
import { useSubmitCustomerFeedback } from "../../hooks/useCustomer";
import { CustomerStackParamList } from "../../types/navigation.types";
import { AppHeader } from "../../components/AppHeader";
import { AppCard } from "../../components/AppCard";
import { AppButton } from "../../components/AppButton";
import { AppInput } from "../../components/AppInput";

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList, "Feedback">;
type RouteProps = RouteProp<CustomerStackParamList, "Feedback">;

export const FeedbackScreen = () => {
  const theme = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { ticketId, ticketNumber } = route.params;

  const submitFeedbackMutation = useSubmitCustomerFeedback();

  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (rating === 0) newErrors.rating = "Please choose a star rating";
    if (!review.trim()) newErrors.review = "Please write a review comment";
    return newErrors;
  };

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    const newErrors = validate();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      await submitFeedbackMutation.mutateAsync({
        ticketId,
        rating,
        review,
      });

      Alert.alert("Thank You!", "Your feedback has been submitted successfully.", [
        { text: "OK", onPress: () => navigation.navigate("CustomerDashboard") },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to submit feedback");
    }
  };

  // Block submit until complete
  const isFormIncomplete = rating === 0 || !review.trim();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader showBack onBackPress={() => navigation.goBack()} title="Service Feedback" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Ticket Header card */}
        <AppCard style={styles.card}>
          <View style={styles.ticketRow}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>Ticket Number</Text>
              <Text style={{ color: theme.colors.danger, fontWeight: "bold" }}> *</Text>
              <Text style={[styles.ticketNo, { color: theme.colors.text }]}>: {ticketNumber}</Text>
            </View>
          </View>
        </AppCard>

        {/* Rating Select row */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Rating</Text>
            <Text style={{ color: theme.colors.danger, fontWeight: "bold" }}> *</Text>
          </View>
          <Text style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 12 }}>
            Tap stars to rate your service satisfaction.
          </Text>

          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => {
              const isSelected = star <= rating;
              return (
                <Pressable
                  key={star}
                  onPress={() => {
                    setRating(star);
                    if (errors.rating) setErrors((prev) => ({ ...prev, rating: "" }));
                  }}
                  style={styles.starBtn}
                >
                  <Star
                    size={38}
                    color={isSelected ? theme.colors.warning : theme.colors.textLight}
                    fill={isSelected ? theme.colors.warning : "transparent"}
                  />
                </Pressable>
              );
            })}
          </View>
          {submitAttempted && errors.rating ? (
            <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.rating}</Text>
          ) : null}
        </View>

        {/* Review comment Text Area */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Review</Text>
            <Text style={{ color: theme.colors.danger, fontWeight: "bold" }}> *</Text>
          </View>
          <AppInput
            placeholder="Share details about your experience. Was the technician polite? Was the issue resolved?"
            value={review}
            onChangeText={(val) => {
              setReview(val);
              if (errors.review) setErrors((prev) => ({ ...prev, review: "" }));
            }}
            multiline
            numberOfLines={5}
          />
          {submitAttempted && errors.review ? (
            <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.review}</Text>
          ) : null}
        </View>

        {/* Submit action */}
        <AppButton
          title="Submit Feedback"
          onPress={handleSubmit}
          disabled={isFormIncomplete}
          loading={submitFeedbackMutation.isPending}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 20,
    padding: 16,
  },
  ticketRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
  ticketNo: {
    fontSize: 14,
    fontWeight: "700",
  },
  section: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 12,
  },
  starBtn: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
});
