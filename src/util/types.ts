import type { teams } from '../constants/constants'

export type Team = typeof teams[number]
export type Coord = [ number, number ]

export class Cell {
  public team = null as Team | null
  public bomb = false
  public wall = false
  public number = 0
  public selected = false

  public constructor (team: Team | null = null, bomb = false) {
    this.team = team
    this.number = team ? 1 : 0
    this.bomb = bomb
  }
}
