// 디스코드 아바타 URL 생성 유틸리티

/**
 * 디스코드 아바타 URL을 생성합니다.
 * 여러 형식을 시도하여 이미지 로딩 성공률을 높입니다.
 */
export function getDiscordAvatarUrl(userId: string, avatarHash: string, size = 80): string[] {
  if (!userId || !avatarHash) {
    return ["/default-avatar.png"]
  }

  // 디스코드 CDN URL 형식이 변경될 수 있으므로 여러 형식을 시도
  return [
    // 기본 형식 (WebP)
    `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.webp?size=${size}`,
    // PNG 형식 (일부 브라우저에서 WebP를 지원하지 않을 경우)
    `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=${size}`,
    // 애니메이션 GIF 형식 (애니메이션 아바타인 경우)
    `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.gif?size=${size}`,
    // 대체 CDN 도메인 (일부 지역에서 접근성 향상)
    `https://images-ext-1.discordapp.net/avatars/${userId}/${avatarHash}.webp?size=${size}`,
    // 대체 이미지
    "/default-avatar.png",
  ]
}

/**
 * 디스코드 기본 아바타 URL을 생성합니다.
 * 사용자 ID를 기반으로 디스코드의 기본 아바타를 가져옵니다.
 */
export function getDiscordDefaultAvatarUrl(userId: string): string {
  if (!userId) {
    return "/default-avatar.png"
  }

  // 디스코드는 사용자 ID를 기반으로 기본 아바타를 할당합니다
  const discriminator = Number.parseInt(userId) % 5
  return `https://cdn.discordapp.com/embed/avatars/${discriminator}.png`
}
