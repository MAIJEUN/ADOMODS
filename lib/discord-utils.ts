/**
 * 디스코드 아바타 URL을 생성합니다.
 * 새로운 API를 사용하여 사용자 ID만으로 아바타를 가져옵니다.
 */
export function getDiscordAvatarUrl(userId: string): string {
  if (!userId) {
    return "/default-avatar.png"
  }

  return `https://avatar-cyan.vercel.app/api/pfp/${userId}/image`
}

/**
 * 디스코드 기본 아바타 URL을 생성합니다.
 * 새로운 API를 사용할 수 없는 경우를 위한 대체 방법입니다.
 */
export function getDiscordDefaultAvatarUrl(userId: string): string {
  if (!userId) {
    return "/default-avatar.png"
  }

  try {
    // 디스코드는 사용자 ID를 기반으로 기본 아바타를 할당합니다
    const discriminator = Number.parseInt(userId.slice(-1), 10) % 6
    return `https://cdn.discordapp.com/embed/avatars/${discriminator}.png`
  } catch (error) {
    return "/default-avatar.png"
  }
}

/**
 * 디스코드 아바타 해시가 유효한지 확인합니다.
 * 새 API를 사용하면 이 함수는 더 이상 필요하지 않지만 호환성을 위해 유지합니다.
 */
export function isValidAvatarHash(hash: string | undefined): boolean {
  if (!hash) return false

  const normalPattern = /^[0-9a-f]{32}$/i
  const animatedPattern = /^a_[0-9a-f]{32}$/i

  return normalPattern.test(hash) || animatedPattern.test(hash)
}
