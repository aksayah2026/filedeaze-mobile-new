import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { KeyRound, ArrowLeft } from "lucide-react-native";

import { useTheme } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import AuthService from "../../services/auth.service";
import { apiClient } from "../../api/client";
import { otpSchema, OtpInput } from "../../validation/auth.validation";
import { AuthStackParamList } from "../../types/navigation.types";
import { AppInput } from "../../components/AppInput";
import { AppButton } from "../../components/AppButton";
import { AppCard } from "../../components/AppCard";

type RouteProps = RouteProp<AuthStackParamList, "OtpVerification">;
type NavigationProp = NativeStackNavigationProp<AuthStackParamList, "OtpVerification">;

export const OtpVerificationScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { email, mode, address } = route.params;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpInput>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const onSubmit = async (data: OtpInput) => {
    setLoading(true);
    setError(null);
    try {
      if (mode === "register") {
        const loginRes = await AuthService.verifyOtp(email, data.otp);
        // Save address using the token returned by the verification endpoint
        if (address) {
          try {
            await apiClient.post(
              "/mobile/customer/addresses",
              {
                street: address,
                city: "Local",
                label: "home",
              },
              {
                headers: {
                  Authorization: `Bearer ${loginRes.token}`,
                },
              }
            );
          } catch (addrErr) {
            console.error("Failed to save customer address:", addrErr);
          }
        }

        // Save authentication credentials in the Zustand store to trigger dashboard navigation
        const userProfile = {
          id: loginRes.user.id,
          name: loginRes.user.name,
          mobile: loginRes.user.mobile,
          role: loginRes.user.role as any,
          email: loginRes.user.email,
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
        };

        useAuthStore.setState({
          user: userProfile,
          token: loginRes.token,
          role: loginRes.user.role as any,
          isAuthenticated: true,
        });

        setLoading(false);
      } else {
        const res = await AuthService.verifyForgotPasswordOtp(email, data.otp);
        setLoading(false);
        navigation.navigate("ResetPassword", { email, token: res.resetToken });
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "Invalid OTP code. Please check and try again.");
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    try {
      if (mode === "forgot_password") {
        await AuthService.forgotPassword(email);
      } else {
        await AuthService.resendOtp(email);
      }
      Alert.alert("Code Resent", "A new OTP code has been dispatched to your email address.");
    } catch (err: any) {
      setError(err?.message || "Failed to resend verification code.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color={theme.colors.text} size={24} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Enter Code</Text>
        </View>

        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          An OTP verification code was sent to the email address:{" "}
          <Text style={{ fontWeight: "600", color: theme.colors.text }}>{email}</Text>.
        </Text>

        <AppCard style={styles.formCard}>
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: `${theme.colors.danger}12` }]}>
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
            </View>
          )}

          <Controller
            control={control}
            name="otp"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Verification Code (OTP)"
                placeholder="Enter 6-digit code"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.otp?.message}
                keyboardType="number-pad"
                leftIcon={<KeyRound size={20} color={theme.colors.textLight} />}
              />
            )}
          />

          <AppButton
            title="Verify Code"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={{ marginTop: 16 }}
          />

          <Pressable onPress={handleResendOtp} style={{ marginTop: 16, alignItems: "center" }}>
            <Text style={{ fontSize: 13, color: theme.colors.primary, fontWeight: "600" }}>
              Resend Verification Code
            </Text>
          </Pressable>
        </AppCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 24,
    paddingLeft: 4,
  },
  formCard: {
    width: "100%",
    padding: 20,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 18,
  },
  helpBox: {
    marginTop: 20,
    alignItems: "center",
  },
});
export default OtpVerificationScreen;
