<template>
  <div v-if="loading" class="loader" disabled>
    <loader class="spinner"></loader>
  </div>
  <links v-else :to="targetUrl">
    <span v-if="dynamic">{{ label }}</span>
    <span v-else>{{ $t('app') }}</span>
  </links>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import Links from './Links.vue'
import Loader from './Loader.vue'
import {
  LOAD_ROUNDS,
  SELECT_ROUND,
  LOAD_ROUND_INFO,
} from '@/store/action-types'
import { getCurrentRound } from '@/api/round'

@Component({ components: { Links, Loader } })
export default class extends Vue {
  // if dynamic, show the label text based when round status
  // otherwise show the static text 'App'
  @Prop() dynamic!: boolean

  showLeaderboard = false
  loading = true

  async created() {
    if (!this.$store.state.rounds) {
      await this.$store.dispatch(LOAD_ROUNDS)
    }

    if (!this.$store.state.currentRoundAddress) {
      const currentRoundAddress = await getCurrentRound()
      await this.$store.dispatch(SELECT_ROUND, currentRoundAddress)
      await this.$store.dispatch(LOAD_ROUND_INFO)
    }

    if (!this.$store.state.currentRound) {
      await this.$store.dispatch(LOAD_ROUND_INFO)
    }

    const count = await this.getProjectCount()
    this.showLeaderboard = count > 0
    this.loading = false
  }

  async getProjectCount(): Promise<number> {
    const roundAddress = this.$store.state.currentRoundAddress
    const round = await this.$store.state.rounds?.getRound(roundAddress)
    const projects = round?.getLeaderboardProjects()
    const count = projects?.length || 0

    return count
  }

  get targetUrl(): string {
    const roundAddress = this.$store.state.currentRoundAddress

    return this.showLeaderboard
      ? `/rounds/${roundAddress}/leaderboard`
      : '/projects'
  }

  translate(text: string): string {
    return this.$t(text).toString()
  }

  get label(): string {
    return this.showLeaderboard
      ? this.translate('dynamic.appLink.leaderboard')
      : this.translate('dynamic.appLink.getStarted')
  }
}
</script>

<style lang="scss" scoped>
.loader {
  width: 100%;
  display: flex;
  justify-content: center;

  .spinner {
    margin: 0;
  }

  .spinner::after {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
    border: 5px solid var(--loader-color);
    border-color: var(--loader-color) transparent var(--loader-color)
      transparent;
  }
}
</style>
