import type { teams } from '../constants/constants'

export type Cell = {
  team?: Team
  bomb?: boolean
  wall?: boolean
  number?: number
  selected?: boolean
}
export type Team = typeof teams[number]
