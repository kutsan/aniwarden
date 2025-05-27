import { gql } from 'graphql-request'

export const UserIdDocument = gql`
  query ($username: String!) {
    User(name: $username) {
      id
    }
  }
`

export const MediaListCollectionDocument = gql`
  query ($type: MediaType!, $userId: Int!, $statuses: [MediaListStatus!]!) {
    MediaListCollection(type: $type, userId: $userId, status_in: $statuses) {
      lists {
        name
        entries {
          progress
          media {
            id
            status
            episodes
            nextAiringEpisode {
              episode
            }
            title {
              romaji
              english
            }
          }
        }
      }
    }
  }
`
