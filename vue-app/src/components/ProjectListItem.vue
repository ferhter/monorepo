<template>
  <div class="project-item">
    <div>
      <links :to="projectRoute">
        <div class="project-image">
          <img :src="projectImageUrl" :alt="project.name" />
          <div v-if="project.category" class="tag">
            {{ $t($store.getters.categoryLocaleKey(project.category)) }}
          </div>
        </div>
      </links>
      <div class="project-info">
        <div class="project-name">
          <links :to="projectRoute">
            {{ project.name }}
          </links>
        </div>
        <links :to="projectRoute">
          <div class="project-description">{{ project.tagline }}</div>
        </links>
      </div>
    </div>
    <div class="buttons">
      <add-to-cart-button v-if="shouldShowCartInput" :project="project" />
      <links :to="projectRoute">
        <button class="more-btn">{{ $t('projectListItem.button1') }}</button>
      </links>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

import AddToCartButton from '@/components/AddToCartButton.vue'
import Links from '@/components/Links.vue'
import { CartItem } from '@/api/contributions'
import { Project } from '@/api/projects'
import { markdown } from '@/utils/markdown'
import { Route } from 'vue-router'

@Component({
  components: {
    AddToCartButton,
    Links,
  },
})
export default class ProjectListItem extends Vue {
  @Prop()
  project!: Project
  @Prop({ default: '' }) roundAddress!: string

  get descriptionHtml(): string {
    return markdown.renderInline(this.project.description)
  }

  get projectImageUrl(): string | null {
    if (typeof this.project.bannerImageUrl !== 'undefined') {
      return this.project.bannerImageUrl
    }
    if (typeof this.project.imageUrl !== 'undefined') {
      return this.project.imageUrl
    }
    return null
  }

  get inCart(): boolean {
    const index = this.$store.state.cart.findIndex((item: CartItem) => {
      // Ignore cleared items
      return item.id === this.project.id && !item.isCleared
    })
    return index !== -1
  }

  get isCurrentRound(): boolean {
    const { currentRoundAddress } = this.$store.state
    const roundAddress = this.roundAddress || currentRoundAddress
    return this.$store.getters.isCurrentRound(roundAddress)
  }

  get shouldShowCartInput(): boolean {
    const { isRoundContributionPhase, canUserReallocate } = this.$store.getters
    return (
      this.isCurrentRound && (isRoundContributionPhase || canUserReallocate)
    )
  }

  get projectRoute(): Partial<Route> {
    return this.$route.name === 'round'
      ? {
          name: 'round-project',
          params: { address: this.roundAddress, id: this.project.id },
        }
      : { name: 'project', params: { id: this.project.id } }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.project-item {
  background-color: var(--bg-secondary-color);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 0;
  &:hover {
    transform: scale(1.01);
    box-shadow: 0px 4px 4px 0px 0, 0, 0, 0.25;
  }
}

.more-btn {
  background: var(--bg-light-accent);
  border-radius: 32px;
  padding: 0.5rem;
  box-shadow: 0px 4px 4px 0px 0, 0, 0, 0.25;
  font-family: Inter;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 24px;
  letter-spacing: 0em;
  text-align: center;
  color: white;
  width: 100%;
  border: none;
  cursor: pointer;
  &:hover {
    background: var(--bg-secondary-accent);
  }
}

.project-image {
  margin-bottom: 1rem;
  border-radius: 8px 8px 0 0;
  height: 8rem;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  box-shadow: 0px 4px 4px 0px 0, 0, 0, 0.25;
  position: relative;

  img {
    border-radius: 8px;
    flex-shrink: 0;
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
}

.project-info {
  display: flex;
  line-height: 150%;
  flex-direction: column;
  padding: 0 1.5rem;
  padding-top: 0rem;
}

.buttons {
  display: flex;
  flex-direction: column;
  row-gap: 1rem;
  padding: 0 1.5rem;
  padding-bottom: 1.5rem;
}

.project-name {
  display: flex;
  align-items: flex-start;
  font-weight: 700;
  margin-bottom: 1.5rem;
  font-size: 20px;
  * {
    color: var(--text-body);
  }
}

.project-description {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  font-size: 16px;
  overflow: hidden;
  margin-bottom: 1rem;
  color: var(--text-body);
  opacity: 0.8;
}

.btn {
  margin-top: 20px;
}

.tag {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  box-shadow: var(--box-shadow);
}
</style>
