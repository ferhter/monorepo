<template>
  <div v-if="haveLink" class="link-box">
    <h2 class="link-title">{{ $t('linkBox.h2') }}</h2>
    <div v-if="project.githubUrl" class="link-row">
      <img src="@/assets/GitHub.svg" />
      <links :to="project.githubUrl">{{ $t('linkBox.link1') }}</links>
    </div>
    <div v-if="project.twitterUrl" class="link-row">
      <img src="@/assets/Twitter.svg" />
      <links :to="project.twitterUrl">{{ $t('linkBox.link2') }}</links>
    </div>
    <div v-if="project.websiteUrl" class="link-row">
      <img src="@/assets/Meridians.svg" />
      <links :to="project.websiteUrl">{{ project.websiteUrl }}</links>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { Project } from '@/api/projects'
import Links from '@/components/Links.vue'

@Component({ components: { Links } })
export default class extends Vue {
  @Prop() project!: Project

  get haveLink(): boolean {
    return Boolean(
      this.project.websiteUrl ||
        this.project.twitterUrl ||
        this.project.githubUrl
    )
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.link-box {
  background: var(--bg-primary-color);
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: var(--box-shadow);
  overflow-wrap: anywhere;

  .link-title {
    font-size: 1.5rem;
    margin: 0;
    margin-bottom: 1rem;
    font-family: 'Glacial Indifference', sans-serif;
  }

  .link-row {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    gap: 0.5rem;
  }
}
</style>
