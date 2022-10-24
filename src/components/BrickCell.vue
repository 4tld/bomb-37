<template>
  <div
    class="cell"
    :class="{ selectable }"
  >
    <div :class="classes" />
    <div
      v-if="Number(cell.number) >= 2"
      :class="classes"
      class="second"
    />
    <div
      v-if="Number(cell.number) == 3"
      :class="classes"
      class="third"
    />
    <div
      v-if="cell.bomb && cell.team"
      :class="classes"
      class="on-bomb"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { Cell } from '../util/types'

export default defineComponent({
  name: 'BrickCell',
  expose: [],

  props: {
    cell: {
      type: Object as () => Cell,
      required: true,
    },

    turn: {
      type: String as () => 'black' | 'white',
      required: true,
    },

    moveIsDestination: {
      type: Boolean,
      required: true,
    },

    destinationPossible: {
      type: Boolean,
      required: true,
    },
  },

  computed: {
    selectable () {
      return !this.moveIsDestination && this.turn == this.cell.team && !this.cell.wall || this.destinationPossible
    },

    classes () {
      return {
        bomb: this.cell.bomb,
        white: this.cell.team == 'white',
        black: this.cell.team == 'black',
        wall: this.cell.wall,
        double: this.cell.number == 2,
        triple: this.cell.number == 3,
        selectable: this.selectable,
        selected: this.cell.selected,
      }
    },
  },
})
</script>
