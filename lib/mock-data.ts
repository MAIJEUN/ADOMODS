// 모의 데이터 - API가 실패할 경우 사용
export const mockMods = [
  {
    _id: "mock1",
    id: "mock1",
    name: "Overlayer",
    version: "3.19.1",
    description: "# Overlayer\n\n게임 플레이 중 다양한 정보를 오버레이로 표시해주는 모드입니다.",
    download: "https://github.com/square3ang/Overlayer/releases/tag/3.19.1",
    parsedDownload: "https://github.com/square3ang/Overlayer/releases/download/3.19.1/Overlayer.zip",
    cachedUsername: "kkitut",
    cachedAvatar: "54dcaea92f63f44237223ed6341889b5",
    user: "700176751422341201",
    uploadedTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2일 전
  },
  {
    _id: "mock2",
    id: "mock2",
    name: "AdofaiTweaks",
    version: "2.5.0",
    description: "# AdofaiTweaks\n\n게임의 다양한 기능을 개선하고 추가하는 모드입니다.",
    download: "https://github.com/example/AdofaiTweaks/releases/tag/2.5.0",
    parsedDownload: "https://github.com/example/AdofaiTweaks/releases/download/2.5.0/AdofaiTweaks.zip",
    cachedUsername: "modder123",
    cachedAvatar: "",
    user: "123456789012345678",
    uploadedTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5일 전
  },
  {
    _id: "mock3",
    id: "mock3",
    name: "CustomLevels",
    version: "1.8.2",
    description: "# CustomLevels\n\n커스텀 레벨을 추가하고 관리할 수 있는 모드입니다.",
    download: "https://github.com/example/CustomLevels/releases/tag/1.8.2",
    parsedDownload: "https://github.com/example/CustomLevels/releases/download/1.8.2/CustomLevels.zip",
    cachedUsername: "leveldesigner",
    cachedAvatar: "",
    user: "987654321098765432",
    uploadedTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 10, // 10일 전
  },
  {
    _id: "mock4",
    id: "mock4",
    name: "BetterEditor",
    version: "4.2.1",
    description: "# BetterEditor\n\n레벨 에디터의 기능을 개선하고 확장하는 모드입니다.",
    download: "https://github.com/example/BetterEditor/releases/tag/4.2.1",
    parsedDownload: "https://github.com/example/BetterEditor/releases/download/4.2.1/BetterEditor.zip",
    cachedUsername: "editor_pro",
    cachedAvatar: "",
    user: "456789012345678901",
    uploadedTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 15, // 15일 전
  },
  {
    _id: "mock5",
    id: "mock5",
    name: "SoundFX",
    version: "1.3.0",
    description: "# SoundFX\n\n게임에 다양한 사운드 효과를 추가하는 모드입니다.",
    download: "https://github.com/example/SoundFX/releases/tag/1.3.0",
    parsedDownload: "https://github.com/example/SoundFX/releases/download/1.3.0/SoundFX.zip",
    cachedUsername: "audio_master",
    cachedAvatar: "",
    user: "234567890123456789",
    uploadedTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 20, // 20일 전
  },
  // 버전 정보가 없는 모드 (필터링 테스트용)
  {
    _id: "mock6",
    id: "mock6",
    name: "NoVersionMod",
    version: "",
    description: "# NoVersionMod\n\n버전 정보가 없는 모드입니다.",
    download: "https://github.com/example/NoVersionMod/releases/latest",
    parsedDownload: "https://github.com/example/NoVersionMod/releases/download/latest/NoVersionMod.zip",
    cachedUsername: "test_user",
    cachedAvatar: "",
    user: "111222333444555666",
    uploadedTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 25, // 25일 전
  },
]
