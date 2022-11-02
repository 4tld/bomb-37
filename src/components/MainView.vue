<template>
  <div class="text">
    <h1>Bomb 37</h1>
    <h2>{{ turn }}'s turn</h2>
    <h2 v-if="win">
      {{ win }} wins!
    </h2>
    <div
      v-if="selected"
      @click="removeSelection"
    >
      <svg
        class="cancel icon"
        viewBox="0 0 14 12"
      >
        <path
          class="icon-shadow"
          d="m0 3h11l3 3v2a4 4 0 01-4 4h-2v-3h3l1-1a2 2 0 00-2-2h-7v2l-3-3z"
        />
        <path d="m0 3 3-3v2h7a2 2 90 010 8h-2v-2h2a2 2 90 000-4h-7v2z" />
      </svg>
    </div>
  </div>
  <div class="board" :class="{rotated: turn=='white'}">
    <div
      v-for="row, rowIndex in rows"
      :id="`row-${rowIndex}`"
      :key="rowIndex"
      class="row"
    >
      <BrickCell
        v-for="cell, cellIndex in row"
        :key="cellIndex"
        :cell="cell"
        :turn="turn"
        :move-is-destination="Boolean(selected)"
        :destination-possible="isDestinationPossible([rowIndex, cellIndex])"
        @click="selectCell([rowIndex, cellIndex])"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Cell, type Coord, type Team } from '../util/types'
import BrickCell from './BrickCell.vue'

export default defineComponent({
  name: 'MainView',
  expose: [],
  components: { BrickCell },

  data () {
    return {
      win: null as Team | null,
      turn: 'white' as Team,
      selected: null as Coord | null,
      rows: [] as Cell[][],
    }
  },

  created () {
    this.rows.push(Array.from({ length: 4 }, () => new Cell('white')))
    this.rows.push(Array.from({ length: 5 }, () => new Cell('white')))
    this.rows.push(Array.from({ length: 6 }, () => new Cell()))
    this.rows.push([ new Cell(), new Cell(), new Cell(), new Cell(null, true), new Cell(), new Cell(), new Cell() ])
    this.rows.push(Array.from({ length: 6 }, () => new Cell()))
    this.rows.push(Array.from({ length: 5 }, () => new Cell('black')))
    this.rows.push(Array.from({ length: 4 }, () => new Cell('black')))

    this.turn = Math.random() > 0.5 ? 'white' : 'black'
    window.addEventListener('keydown', ({ key }) => {
      if (key == 'Escape') this.removeSelection()
    })
    window.addEventListener('contextmenu', ({ preventDefault }) => {
      preventDefault()
      this.removeSelection()
    })
  },

  methods: {
    findCell([ rowIndex, colIndex ]: Coord) {
      return this.rows[rowIndex][colIndex]
    },

    cellReachable (startingCell: Coord, [ row2, col2 ]: Coord) {
      // Selecting cell1, trying to select cell2
      return this.findAdjacentCells(startingCell).some(([row, col]) => row == row2 && col == col2)
    },

    isDestinationPossible (coord: Coord) {
      if (!this.selected) return false
      if (!this.cellReachable(this.selected, coord)) return false

      const cell = this.findCell(coord)
      const startingCell = this.findCell(this.selected)

      if (cell.wall) return false // Can't move to wall
      if (this.selected[0] == coord[0] && this.selected[1] == coord[1] && !cell.bomb) return true // Can change to wall except if bomb
      if (cell.number == 3) return false // Can't move to triple brick
      if (!startingCell.bomb && !cell.bomb && cell.team == this.turn && (cell.number ?? 1) + (startingCell.number ?? 1) <= 3) return true // Add to stack except bomb
      if (!cell.team && !cell.bomb) return true // Move to empty space
      if (!cell.team && cell.bomb && (startingCell.number ?? 1) < 2) return true // Move to bomb
      if (startingCell.bomb && cell.team != this.turn && (cell.number ?? 1) < 2) return true // Move on enemy if bomb

      return false
    },

    selectCell (coord: Coord) {
      if (this.selected) {
        if (!this.isDestinationPossible(coord)) return
        const startingCell = this.rows[this.selected[0]][this.selected[1]]
        const destinationCell = this.findCell(coord)

        if (this.selected[0] == coord[0] && this.selected[1] == coord[1]) {
          // Change to wall
          startingCell.wall = true
        } else {
          destinationCell.bomb = startingCell.bomb || destinationCell.bomb
          destinationCell.number = startingCell.number + (destinationCell.team == startingCell.team ? destinationCell.number : 0)
          destinationCell.team = startingCell.team
          startingCell.team = null
          startingCell.number = 0
          startingCell.bomb = false
        }

        this.checkCollision()
        this.checkVictory()

        this.removeSelection()
        this.turn = this.turn == 'white' ? 'black' : 'white'

        this.checkCollision()
      } else {
        const cell = this.findCell(coord)
        if (this.turn != cell.team || cell.wall) return
        cell.selected = true
        this.selected = coord
      }
    },

    removeSelection () {
      if (this.selected) {
        this.findCell(this.selected).selected = false
        this.selected = null
      }
    },

    findAdjacentCells ([ rowIndex, colIndex ]: Coord) {
      const adjacent = [ [ rowIndex, colIndex ]]
      if (colIndex > 0) adjacent.push([ rowIndex, colIndex - 1 ])
      if (colIndex < this.rows[rowIndex].length - 1) adjacent.push([ rowIndex, colIndex + 1 ])
      // On row above
      if (rowIndex > 0) {
        const rowAbove = this.rows[rowIndex - 1]
        if (this.rows[rowIndex].length > rowAbove.length) {
          if (colIndex < rowAbove.length) adjacent.push([ rowIndex - 1, colIndex ])
          if (colIndex - 1 >= 0) adjacent.push([ rowIndex - 1, colIndex - 1 ])
        } else {
          adjacent.push([ rowIndex - 1, colIndex ])
          if (colIndex + 1 < rowAbove.length) adjacent.push([ rowIndex - 1, colIndex + 1 ])
        }
      }
      // On row below
      if (rowIndex < this.rows.length - 1) {
        const rowBelow = this.rows[rowIndex + 1]
        if (this.rows[rowIndex].length > rowBelow.length) {
          if (colIndex < rowBelow.length) adjacent.push([ rowIndex + 1, colIndex ])
          if (colIndex - 1 >= 0) adjacent.push([ rowIndex + 1, colIndex - 1 ])
        } else {
          adjacent.push([ rowIndex + 1, colIndex ])
          if (colIndex + 1 < rowBelow.length) adjacent.push([ rowIndex + 1, colIndex + 1 ])
        }
      }
      return adjacent
    },

    checkCollision () {
      this.rows.forEach((col, rowIndex) => {
        col.forEach((cell, colIndex) => {
          if (!cell.team || cell.team === this.turn) return
          const adjacent = this.findAdjacentCells([ rowIndex, colIndex ])
          let isBomb = false
          let number = 0
          adjacent.forEach(([ rowAdj, colAdj ]) => {
            const adjCell = this.rows[rowAdj][colAdj]
            if (adjCell.team === this.turn) {
              number++
              if (adjCell.bomb) isBomb = true
            }
          })
          if (number > (cell.number ?? 1) && (!cell.wall || isBomb)) {
            cell.team = null
            cell.number = 0
            cell.wall = false
          }
        })
      })
    },

    checkVictory () {
      if (this.rows[0].some((cell) => cell.bomb)) {
        this.win = 'black'
        return
      }
      if (this.rows.at(-1)?.some((cell) => cell.bomb)) {
        this.win = 'white'
        return
      }

      let hasWhite = false
      let hasBlack = false
      this.rows.forEach((row) => {
        row.forEach((cell) => {
          if (cell.team == 'black' && !cell.wall && (cell.number ?? 1) < 2) hasBlack = true
          if (cell.team == 'white' && !cell.wall && (cell.number ?? 1) < 2) hasWhite = true
        })
      })
      if (!hasBlack) {
        this.win = 'white'
        return
      }
      if (!hasWhite) {
        this.win = 'black'
      }
    },
  },
})
</script>
