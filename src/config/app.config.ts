import { Platform } from "react-native";

const devUrl = Platform.OS === "android" ? "http://192.168.0.109:3000/api/v1" : "http://localhost:3000/api/v1";

export const APP_CONFIG = {
  tenantId: "1b9f53fc-6548-4aa6-97ee-c909ad9ad444",
  tenantCode: "abc",
  appName: "ABC Services Ltd",
  apiBaseUrl: devUrl,
  timeoutMs: 15000,
};
