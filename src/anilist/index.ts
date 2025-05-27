import { getCurrentAnimeList } from './anime-list.ts'
import type { UserAnimeEntry } from './types.ts'
import { getUserId } from './user.ts'

export type { UserAnimeEntry } from './types.ts'

export async function getUserAnimeList(
  username: string,
): Promise<UserAnimeEntry[]> {
  const userId = await getUserId(username)
  const animelist = await getCurrentAnimeList(userId)
  return animelist
}
