/** users에 저장할 필수 정보가 다 있는지 */
export function isProfileComplete(profile) {
  return Boolean(
    profile?.name?.trim() &&
      profile?.birthDate &&
      profile?.birthTime &&
      profile?.gender,
  )
}
