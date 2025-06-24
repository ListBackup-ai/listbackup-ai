export default {
  expo: {
    name: "ListBackup.ai",
    slug: "listbackup-ai",
    version: "2.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "ai.listbackup.app",
      buildNumber: "1",
      infoPlist: {
        NSFaceIDUsageDescription: "This app uses Face ID for secure authentication",
        NSCameraUsageDescription: "This app uses the camera to scan QR codes for quick integration setup"
      },
      config: {
        usesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "ai.listbackup.app",
      versionCode: 1,
      permissions: [
        "USE_BIOMETRIC",
        "USE_FINGERPRINT",
        "CAMERA"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "https://main.api.listbackup.ai",
      cognitoRegion: process.env.EXPO_PUBLIC_COGNITO_REGION || "us-east-1",
      cognitoUserPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID,
      cognitoClientId: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID,
      eas: {
        projectId: process.env.EAS_PROJECT_ID
      }
    },
    plugins: [
      "expo-secure-store",
      "expo-local-authentication",
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera for QR code scanning"
        }
      ]
    ]
  }
}