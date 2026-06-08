import { Platform } from "react-native";

const devUrl = Platform.OS === "android" ? "http://10.0.2.2:3000/api/v1" : "http://localhost:3000/api/v1";

export const APP_CONFIG = {
  tenantId: "e21f3a83-1de8-47a5-9adf-a6b29df7043f",
  tenantCode: "aaa",
  appName: "AAA Services Ltd",
  apiBaseUrl: devUrl,
  timeoutMs: 15000,
};
