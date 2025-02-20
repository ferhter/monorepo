<template>
  <div v-if="project" class="project-page">
    <info
      v-if="previewMode"
      class="info"
      :message="$t('projectProfile.info1')"
    />
    <img
      v-if="previewMode"
      class="project-image"
      :src="project.bannerImageUrl"
      :alt="project.name"
    />
    <div class="about">
      <h1
        class="project-name"
        :title="addressName"
        :project-index="project.index"
      >
        <links v-if="klerosCurateUrl" :to="klerosCurateUrl">{{
          project.name
        }}</links>
        <span v-else> {{ project.name }} </span>
      </h1>
      <p class="tagline">{{ project.tagline }}</p>
      <div class="subtitle">
        <div v-if="project.category" class="tag">
          {{ $t($store.getters.categoryLocaleKey(project.category)) }}
          {{ $t('projectProfile.div1') }}
        </div>
        <div class="team-byline" v-if="!!project.teamName">
          {{ $t('projectProfile.div2') }}
          <links to="#team"> {{ project.teamName }}</links>
        </div>
      </div>
      <div class="mobile mb2">
        <add-to-cart-button
          v-if="shouldShowCartInput && hasContributeBtn()"
          :project="project"
        />
        <claim-button :project="project" :roundAddress="roundAddress" />
        <p
          v-if="
            $store.getters.hasUserContributed &&
            !$store.getters.canUserReallocate
          "
        >
          {{ $t('projectProfile.p1') }}
        </p>
      </div>
      <div class="project-section">
        <h2>{{ $t('projectProfile.h2_1') }}</h2>
        <markdown :raw="project.description" />
      </div>
      <div v-if="project.problemSpace" class="project-section">
        <h2>{{ $t('projectProfile.h2_2') }}</h2>
        <markdown :raw="project.problemSpace" />
      </div>
      <div v-if="project.plans" class="project-section">
        <h2>{{ $t('projectProfile.h2_3') }}</h2>
        <markdown :raw="project.plans" />
      </div>
      <div
        :class="{
          'address-box': project.teamName || project.teamDescription,
          'address-box-no-team': !project.teamName && !project.teamDescription,
        }"
      >
        <div>
          <div class="address-label">{{ $t('projectProfile.div3') }}</div>
          <div class="address">
            {{ addressName }}
          </div>
        </div>
        <div class="copy-div">
          <copy-button
            :value="project.address"
            :text="$t('projectProfile.button1')"
            myClass="project-profile"
            :hasBorder="true"
          />
          <links
            class="explorerLink"
            :to="blockExplorer.url"
            :title="
              $t('projectProfile.link1', { blockExplorer: blockExplorer.label })
            "
            :hideArrow="true"
          >
            <img
              class="icon"
              :src="require(`@/assets/${blockExplorer.logo}`)"
            />
          </links>
        </div>
      </div>
      <hr v-if="project.teamName || project.teamDescription" />
      <div
        id="team"
        v-if="project.teamName || project.teamDescription"
        class="team"
      >
        <h2>{{ $t('projectProfile.h2_4') }} {{ project.teamName }}</h2>
        <markdown :raw="project.teamDescription" />
      </div>
    </div>
    <link-box v-if="previewMode" :project="project" class="mt2" />
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { DateTime } from 'luxon'
import { Project } from '@/api/projects'
import { DEFAULT_CONTRIBUTION_AMOUNT, CartItem } from '@/api/contributions'
import { RoundStatus } from '@/api/round'
import { chain } from '@/api/core'
import { SAVE_CART } from '@/store/action-types'
import { ADD_CART_ITEM } from '@/store/mutation-types'
import { ensLookup } from '@/utils/accounts'
import Info from '@/components/Info.vue'
import Markdown from '@/components/Markdown.vue'
import CopyButton from '@/components/CopyButton.vue'
import LinkBox from '@/components/LinkBox.vue'
import Links from '@/components/Links.vue'
import AddToCartButton from '@/components/AddToCartButton.vue'
import ClaimButton from '@/components/ClaimButton.vue'

@Component({
  components: {
    Markdown,
    Info,
    LinkBox,
    CopyButton,
    Links,
    AddToCartButton,
    ClaimButton,
  },
})
export default class ProjectProfile extends Vue {
  @Prop() project!: Project
  @Prop() klerosCurateUrl!: string | null
  @Prop() previewMode!: boolean

  contributionAmount: number | null = DEFAULT_CONTRIBUTION_AMOUNT
  ens: string | null = null

  async mounted() {
    if (this.project.address) {
      this.ens = await ensLookup(this.project.address)
    }
  }

  get inCart(): boolean {
    const project = this.project
    if (project === null) {
      return false
    }
    const index = this.$store.state.cart.findIndex((item: CartItem) => {
      // Ignore cleared items
      return item.id === project.id && !item.isCleared
    })
    return index !== -1
  }

  hasContributeBtn(): boolean {
    return (
      this.isCurrentRound &&
      this.$store.state.currentRound &&
      this.project !== null &&
      this.project.index !== 0
    )
  }

  canContribute(): boolean {
    return (
      this.hasContributeBtn() &&
      this.$store.state.currentUser &&
      DateTime.local() < this.$store.state.currentRound.votingDeadline &&
      this.$store.state.currentRound.status !== RoundStatus.Cancelled &&
      this.project !== null &&
      !this.project.isLocked
    )
  }

  contribute() {
    if (!this.contributionAmount) {
      return
    }
    this.$store.commit(ADD_CART_ITEM, {
      ...this.project,
      amount: this.contributionAmount.toString(),
      isCleared: false,
    })
    this.$store.dispatch(SAVE_CART)
  }

  get blockExplorer(): { label: string; url: string; logo: string } {
    return {
      label: chain.explorerLabel,
      url: `${chain.explorer}/address/${this.project.address}`,
      logo: chain.explorerLogo,
    }
  }

  get addressName(): string {
    return this.ens || this.project.address
  }

  get isCurrentRound(): boolean {
    return this.$store.getters.isCurrentRound(this.roundAddress)
  }

  get roundAddress(): string {
    return this.$route.params.address || this.$store.state.currentRoundAddress
  }

  get shouldShowCartInput(): boolean {
    const { isRoundContributionPhase, canUserReallocate } = this.$store.getters
    return (
      this.isCurrentRound && (isRoundContributionPhase || canUserReallocate)
    )
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.project-page {
  h2 {
    font-size: 20px;
  }

  hr {
    border: 0;
    border-bottom: 0.5px solid $button-disabled-text-color;
    margin-bottom: 3rem;
  }

  .info {
    margin-bottom: 1.5rem;
  }

  .project-image {
    border-radius: 0.25rem;
    display: block;
    height: 20rem;
    object-fit: cover;
    text-align: center;
    width: 100%;
    margin-bottom: 2rem;
  }

  .content {
    display: flex;
    gap: 3rem;
    margin-top: 4rem;
  }

  .about {
    .project-name {
      font-family: 'Glacial Indifference', sans-serif;
      font-weight: bold;
      font-size: 2.5rem;
      letter-spacing: -0.015em;
      margin: 0;

      a {
        color: var(--text-color);
      }
    }

    .tagline {
      font-size: 1.5rem;
      line-height: 150%;
      margin-top: 0.25rem;
      margin-bottom: 1rem;
      font-family: 'Glacial Indifference', sans-serif;
    }

    .subtitle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 3rem;
      @media (max-width: $breakpoint-l) {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .team-byline {
        line-height: 150%;
      }
    }

    .project-section {
      margin-bottom: 3rem;
      color: var(--text-body);
    }

    .address-box {
      padding: 1rem;
      margin-bottom: 3rem;
      border-radius: 0.5rem;
      box-shadow: var(--box-shadow);
      background: var(--bg-address-box);
      display: flex;
      align-items: center;
      justify-content: space-between;

      @media (max-width: $breakpoint-m) {
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-start;
      }

      .address-label {
        font-size: 14px;
        margin: 0;
        font-weight: 400;
        margin-bottom: 0.25rem;
        text-transform: uppercase;
      }

      .address {
        display: flex;
        font-family: 'Glacial Indifference', sans-serif;
        font-weight: 600;
        border-radius: 8px;
        align-items: center;
        gap: 0.5rem;
        word-break: break-all;
      }
    }

    .address-box-no-team {
      padding: 1rem;
      border-radius: 0.5rem;
      box-shadow: var(--box-shadow);
      background: var(--bg-address-box);
      display: flex;
      align-items: center;
      justify-content: space-between;

      @media (max-width: $breakpoint-l) {
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-start;
      }
    }

    .team {
      padding: 1rem;
      margin-bottom: 3rem;
      border-radius: 0.25rem;
      background: var(--bg-secondary-color);
      @media (max-width: $breakpoint-l) {
        margin-bottom: 0;
      }

      h2 {
        font-size: 24px;
        font-weight: 400;
        font-family: 'Glacial Indifference', sans-serif;
        margin-top: 0;
      }
    }
  }

  .sticky-column {
    position: sticky;
    top: 2rem;
    align-self: start;
    gap: 1rem;
    display: flex;
    flex-direction: column;

    .button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      justify-content: center;
    }
  }

  .copy-div {
    display: flex;
    gap: 0.5rem;

    .explorerLink {
      margin: 0;
      padding: 0;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;

      &:hover {
        background: var(--bg-light-color);
        opacity: 0.8;
      }
      .icon {
        @include icon(none, none);
        border: 1px solid var(--explorer-border);
        filter: var(--img-filter, invert(0.7));
      }
    }
  }
}
</style>
