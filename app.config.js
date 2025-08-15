export default {
  expo: {
    name: "Tikiti",
    slug: "tikiti",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    splash: {
      resizeMode: "contain",
      backgroundColor: "#6366F1"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#6366F1"
      }
    },
    web: {
      bundler: "metro"
    },
    scheme: "tikiti",
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "tikiti.com"
          },
          {
            scheme: "tikiti"
          }
        ],
        category: ["BROWSABLE", "DEFAULT"]
      }
    ]
  }
};