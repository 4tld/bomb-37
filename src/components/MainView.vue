<template>
  <div class="text">
    <h1>Brick Bomb™</h1>
    <h2>{{ turn }}'s turn</h2>
    <h2 v-if="win">
      {{ win }} wins!
    </h2>
    <div
      v-if="selected"
      @click="removeSelection"
    >
      <svg class="icon cancel" viewBox="0 0 14 12">
        <path class="icon-shadow" d="m0 3h11l3 3v2a4 4 0 01-4 4h-2v-3h3l1-1a2 2 0 00-2-2h-7v2l-3-3z" />
        <path d="m0 3 3-3v2h7a2 2 90 010 8h-2v-2h2a2 2 90 000-4h-7v2z" />
      </svg>
    </div>
  </div>
  <div class="board rotated">
    <div
      v-for="row, rowIndex in rows"
      :key="rowIndex"
      class="row"
      :id="`row-${rowIndex}`"
    >
      <BrickCell
        v-for="cell, cellIndex in row"
        :key="cellIndex"
        :cell="cell"
        :turn="turn"
        :move-is-destination="Boolean(selected)"
        :destination-possible="isDestinationPossible(rowIndex, cellIndex)"
        @click="selectCell(rowIndex, cellIndex)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { Cell, Team } from '../util/types'
import BrickCell from './BrickCell.vue'

export default defineComponent({
  name: 'MainView',
  expose: [],
  components: { BrickCell },

  data () {
    return {
      win: null as Team | null,
      turn: 'white' as Team,
      selected: null as [number, number] | null,
      rows: [
        [{ team: 'white' }, { team: 'white' }, { team: 'white' }, { team: 'white' }],
        [{ team: 'white' }, { team: 'white' }, { team: 'white' }, { team: 'white' }, { team: 'white' }],
        [{}, {}, {}, {}, {}, {}],
        [{}, {}, {}, { bomb: true }, {}, {}, {}],
        [{}, {}, {}, {}, {}, {}],
        [{ team: 'black' }, { team: 'black' }, { team: 'black' }, { team: 'black' }, { team: 'black' }],
        [{ team: 'black' }, { team: 'black' }, { team: 'black' }, { team: 'black' }],
      ] as Cell[][],
    }
  },

  created() {
    this.turn = Math.random() > 0.5 ? 'white' : 'black'
    window.addEventListener('keydown', ({ key }) => key == 'Escape' && this.removeSelection())
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      this.removeSelection()
    })
  },

  methods: {
    cellReachable ([ row1, col1 ]: [ number, number ], [ row2, col2 ]: [ number, number ]) {
      // Selecting cell1, trying to select cell2
      if (row1 == row2) {
        return Math.abs(col1 - col2) <= 1
      } else if (Math.abs(row1 - row2) <= 1) {
        if (this.rows[row1].length < this.rows[row2].length) {
          return col2 - col1 >= 0 && col2 - col1 <= 1
        }
        return col1 - col2 >= 0 && col1 - col2 <= 1
      }
      return false
    },

    isDestinationPossible (rowIndex: number, cellIndex: number) {
      if (!this.selected) return false
      if (!this.cellReachable(this.selected, [ rowIndex, cellIndex ])) return false

      const cell = this.rows[rowIndex][cellIndex]
      const startingCell = this.rows[this.selected[0]][this.selected[1]]

      if (cell.wall) return false // Can't move to wall
      if (this.selected[0] == rowIndex && this.selected[1] == cellIndex && !cell.bomb) return true // Can change to wall except if bomb
      if (cell.number == 3) return false // Can't move to triple brick
      if (!startingCell.bomb && !cell.bomb && cell.team == this.turn && (cell.number ?? 1) + (startingCell.number ?? 1) <= 3) return true // Add to stack except bomb
      if (!cell.team && !cell.bomb) return true // Move to empty space
      if (!cell.team && cell.bomb && (startingCell.number ?? 1) < 2) return true // Move to bomb
      if (startingCell.bomb && cell.team != this.turn && (cell.number ?? 1) < 2) return true // Move on enemy if bomb

      return false
    },

    selectCell (rowIndex: number, cellIndex: number) {
      if (this.selected) {
        if (!this.isDestinationPossible(rowIndex, cellIndex)) return
        const startingCell = this.rows[this.selected[0]][this.selected[1]]
        const destinationCell = this.rows[rowIndex][cellIndex]

        // Action
        if (this.selected[0] == rowIndex && this.selected[1] == cellIndex) {
          // Change to wall
          startingCell.wall = true
        } else if (!destinationCell.team || startingCell.bomb && (destinationCell.number ?? 1) < 2) {
          // Move on empty cell or bomb
          if (startingCell.team) destinationCell.team = startingCell.team
          if (startingCell.bomb) destinationCell.bomb = startingCell.bomb
          if (startingCell.number) destinationCell.number = startingCell.number
          delete startingCell.team
          delete startingCell.bomb
          delete startingCell.number
        } else if (destinationCell.team == startingCell.team) {
          // Add to stack
          destinationCell.number = (destinationCell.number ?? 1) + (startingCell.number ?? 1)
          delete startingCell.team
          delete startingCell.number
        }

        this.checkCollision()
        this.checkVictory()

        this.removeSelection()
        this.turn = this.turn == 'white' ? 'black' : 'white'

        this.checkCollision()
      } else {
        const cell = this.rows[rowIndex][cellIndex]
        if (this.turn != cell.team || cell.wall) return

        cell.selected = true
        this.selected = [ rowIndex, cellIndex ]
      }
    },

    removeSelection () {
      if (this.selected) {
        delete this.rows[this.selected[0]][this.selected[1]].selected
        this.selected = null
      }
    },

    findAdjacentCells (rowIndex: number, colIndex: number) {
      const adjacent = []
      if (colIndex > 0) adjacent.push([ rowIndex, colIndex - 1 ])
      if (colIndex < this.rows[rowIndex].length - 1) adjacent.push([ rowIndex, colIndex + 1 ])
      // On row above
      if (rowIndex > 0) {
        if (this.rows[rowIndex].length > this.rows[rowIndex - 1].length) {
          if (colIndex < this.rows[rowIndex - 1].length - 1) adjacent.push([ rowIndex - 1, colIndex ])
          if (colIndex - 1 >= 0) adjacent.push([ rowIndex - 1, colIndex - 1 ])
        } else {
          adjacent.push([ rowIndex - 1, colIndex ])
          if (colIndex + 1 < this.rows[rowIndex - 1].length - 1) adjacent.push([ rowIndex - 1, colIndex + 1 ])
        }
      }
      // On row below
      if (rowIndex < this.rows.length - 1) {
        if (this.rows[rowIndex].length > this.rows[rowIndex + 1].length) {
          if (colIndex < this.rows[rowIndex + 1].length - 1) adjacent.push([ rowIndex + 1, colIndex ])
          if (colIndex - 1 >= 0) adjacent.push([ rowIndex + 1, colIndex - 1 ])
        } else {
          adjacent.push([ rowIndex + 1, colIndex ])
          if (colIndex + 1 < this.rows[rowIndex + 1].length - 1) adjacent.push([ rowIndex + 1, colIndex + 1 ])
        }
      }
      return adjacent
    },

    checkCollision () {
      this.rows.forEach((col, rowIndex) => {
        col.forEach((cell, colIndex) => {
          if (!cell.team || cell.team === this.turn) return
          const adjacent = this.findAdjacentCells(rowIndex, colIndex)
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
            delete cell.team
            delete cell.number
            delete cell.wall
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
