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
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { User, Phone, Lock, ArrowLeft, Mail, MapPin } from "lucide-react-native";

import { useTheme } from "../../theme";
import AuthService from "../../services/auth.service";
import { registerSchema, RegisterInput } from "../../validation/auth.validation";
import { AuthStackParamList } from "../../types/navigation.types";
import { AppInput } from "../../components/AppInput";
import { AppButton } from "../../components/AppButton";
import { AppCard } from "../../components/AppCard";

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, "Register">;

export const RegisterScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      mobile: "",
      email: "",
      password: "",
      confirmPassword: "",
      address: "",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    setError(null);
    try {
      const response = await AuthService.registerCustomer({
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        password: data.password,
      });
      setLoading(false);
      navigation.navigate("OtpVerification", {
        email: data.email,
        mobile: data.mobile,
        mode: "register",
        name: data.name,
        password: data.password,
        address: data.address,
      });
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "Registration failed. Please try again.");
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
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: theme.colors.background }]}>
            <ArrowLeft color={theme.colors.text} size={20} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Create Account</Text>
        </View>

        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Register to book services and track your requests in real-time.
        </Text>

        <AppCard style={styles.formCard}>
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: `${theme.colors.danger}12` }]}>
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
            </View>
          )}

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Full Name"
                placeholder="e.g. Raj Kumar"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.name?.message}
                leftIcon={<User size={20} color={theme.colors.textLight} />}
              />
            )}
          />

          <Controller
            control={control}
            name="mobile"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Mobile Number"
                placeholder="10-digit mobile number"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.mobile?.message}
                keyboardType="phone-pad"
                leftIcon={<Phone size={20} color={theme.colors.textLight} />}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Email Address"
                placeholder="e.g. customer@email.com"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Mail size={20} color={theme.colors.textLight} />}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Password"
                placeholder="Minimum 8 characters"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                secureTextEntry
                error={errors.password?.message}
                autoCapitalize="none"
                leftIcon={<Lock size={20} color={theme.colors.textLight} />}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Confirm Password"
                placeholder="Confirm your password"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                secureTextEntry
                error={errors.confirmPassword?.message}
                autoCapitalize="none"
                leftIcon={<Lock size={20} color={theme.colors.textLight} />}
              />
            )}
          />

          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Service Address"
                placeholder="Enter complete address detail"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.address?.message}
                leftIcon={<MapPin size={20} color={theme.colors.textLight} />}
              />
            )}
          />

          <AppButton
            title="Register"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={{ marginTop: 16 }}
          />
        </AppCard>

        <Pressable onPress={() => navigation.navigate("Login")} style={styles.loginLink}>
          <Text style={{ fontSize: 13, color: theme.colors.textMuted }}>
            Already have an account?{" "}
            <Text style={{ color: theme.colors.primary, fontWeight: "700" }}>Sign In</Text>
          </Text>
        </Pressable>
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
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
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
  loginLink: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },
});
export default RegisterScreen;
