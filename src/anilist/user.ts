import { client } from './client.ts'
import { UserIdDocument } from './queries.ts'
import { UserIdSchema } from './schemas.ts'

export async function getUserId(username: string): Promise<number> {
  const result = await client.request({
    document: UserIdDocument,
    variables: {
      username,
    },
  })

  const parsedResult = UserIdSchema.safeParse(result)

  if (!parsedResult.success) {
    throw new Error('Invalid response from Anilist API')
  }

  return parsedResult.data.User.id
}
