// 디스코드 아바타 해시가 유효한지 확인합니다.
export function isValidAvatarHash(hash: string | undefined): boolean {
  if (!hash) return false

  // 일반적인 디스코드 아바타 해시 형식 검사 (16진수 32자 또는 a_로 시작하는 애니메이션)
  const normalPattern = /^[0-9a-f]{32}$/i
  const animatedPattern = /^a_[0-9a-f]{32}$/i

  return normalPattern.test(hash) || animatedPattern.test(hash)
}

// 디스코드 기본 아바타 URL을 생성합니다.
export function getDiscordDefaultAvatarUrl(userId: string): string {
  if (!userId) {
    return "/default-avatar.png"
  }

  try {
    // 디스코드는 사용자 ID를 기반으로 기본 아바타를 할당합니다
    // 최신 디스코드 기본 아바타는 0-5 범위의 값을 사용합니다
    const discriminator = Number.parseInt(userId.slice(-1), 10) % 6
    return `https://cdn.discordapp.com/embed/avatars/${discriminator}.png`
  } catch (error) {
    return "/default-avatar.png"
  }
}
