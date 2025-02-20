<template>
  <div class="wrapper">
    <div class="modal-background" @click="$emit('close')" />
    <div class="container">
      <div class="flex-row" style="justify-content: flex-end">
        <div class="close-btn" @click="$emit('close')">
          <p class="no-margin">{{ $t('profile.p1') }}</p>
          <img src="@/assets/close.svg" />
        </div>
      </div>
      <div class="flex-row">
        <h2 class="no-margin">{{ $t('profile.h2_1') }}</h2>
      </div>
      <div class="address-card">
        <h2 class="address">{{ displayAddress }}</h2>
        <div class="action-row" v-if="currentUser">
          <copy-button
            :value="currentUser.walletAddress"
            :text="$t('profile.btn1')"
            myClass="profile copy-icon"
            class="copy"
          />
          <div class="address">
            {{ currentUser.ensName ? currentUser.walletAddress : null }}
          </div>
          <div
            v-tooltip="{
              content: $t('profile.tooltip1'),
              trigger: 'hover click',
            }"
            class="disconnect btn"
            @click="disconnect"
          >
            <img src="@/assets/disconnect.svg" />
          </div>
        </div>
      </div>
      <bright-id-widget
        v-if="showBrightIdWidget"
        :isProjectCard="false"
        @close="$emit('close')"
      />
      <div class="balances-section">
        <div class="flex-row">
          <h2>{{ $t('profile.h2_2', { chain: chain.label }) }}</h2>
          <div
            v-tooltip="{
              content: $t('profile.tooltip2', { chain: chain.label }),
              trigger: 'hover click',
            }"
          >
            <img src="@/assets/info.svg" />
          </div>
        </div>
        <div class="balances-card">
          <balance-item :balance="balance" :abbrev="nativeTokenSymbol">
            <icon-status
              :custom="true"
              :logo="tokenLogo"
              :secondaryLogo="chain.logo"
              :bg="balanceBackgroundColor"
            />
          </balance-item>
          <balance-item :balance="etherBalance" :abbrev="chain.currency">
            <icon-status
              :custom="true"
              logo="eth.svg"
              :secondaryLogo="chain.logo"
              :bg="balanceBackgroundColor"
            />
          </balance-item>
        </div>
        <funds-needed-warning :onNavigate="onNavigateToBridge" />
      </div>
      <div class="projects-section">
        <h2>{{ $t('profile.h2_3') }}</h2>
        <div v-if="projects.length > 0" class="project-list">
          <div
            class="project-item"
            v-for="{
              id,
              name,
              thumbnailImageUrl,
              isHidden,
              isLocked,
            } of projects"
            :key="id"
          >
            <img
              :src="thumbnailImageUrl"
              :alt="alt + ' thumbnail'"
              class="project-thumbnail"
            />
            <div class="project-details">
              <div class="project-name">
                {{ name }}
                <span v-if="isLocked">🔒</span>
              </div>
              <div v-if="isHidden" class="project-hidden">
                {{ $t('profile.div1') }}
              </div>
            </div>
            <button class="btn-secondary" @click="navigateToProject(id)">
              {{ isLocked ? $t('profile.btn2_1') : $t('profile.btn2_2') }}
            </button>
          </div>
        </div>
        <div v-if="!isLoading && projects.length === 0">
          {{ $t('profile.div2') }}
        </div>
        <loader v-if="isLoading" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import BalanceItem from '@/components/BalanceItem.vue'
import IconStatus from '@/components/IconStatus.vue'
import BrightIdWidget from '@/components/BrightIdWidget.vue'
import CopyButton from '@/components/CopyButton.vue'
import Loader from '@/components/Loader.vue'
import Links from '@/components/Links.vue'
import FundsNeededWarning from '@/components/FundsNeededWarning.vue'

import { LOGOUT_USER } from '@/store/action-types'
import { User } from '@/api/user'
import { userRegistryType, UserRegistryType, chain } from '@/api/core'
import { Project, getProjects } from '@/api/projects'
import { ChainInfo } from '@/plugins/Web3/constants/chains'
import { isSameAddress } from '@/utils/accounts'
import { getTokenLogo } from '@/utils/tokens'

@Component({
  components: {
    BalanceItem,
    BrightIdWidget,
    IconStatus,
    CopyButton,
    Loader,
    Links,
    FundsNeededWarning,
  },
})
export default class Profile extends Vue {
  @Prop() balance!: string
  @Prop() etherBalance!: string
  projects: Project[] = []
  balanceBackgroundColor = '#2a374b'
  isLoading = true

  async created() {
    this.isLoading = true
    await this.loadProjects()
    if (this.showBrightIdWidget) {
      await this.$store.dispatch('LOAD_BRIGHT_ID')
    }
    this.isLoading = false
  }

  get walletProvider(): any {
    return this.$store.state.currentUser?.walletProvider
  }

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }

  get showBrightIdWidget(): boolean {
    return (
      userRegistryType === UserRegistryType.BRIGHT_ID &&
      !this.$store.getters.hasContributionPhaseEnded
    )
  }

  get chain(): ChainInfo {
    return chain
  }

  get nativeTokenSymbol(): string {
    return this.$store.getters.nativeTokenSymbol
  }

  get tokenLogo(): string {
    return getTokenLogo(this.nativeTokenSymbol)
  }

  get displayAddress(): string | null {
    if (!this.currentUser) return null
    return this.currentUser.ensName ?? this.currentUser.walletAddress
  }

  private async loadProjects(): Promise<void> {
    const { recipientRegistryAddress, currentRound, currentUser } =
      this.$store.state
    const projects: Project[] = await getProjects(
      recipientRegistryAddress,
      currentRound?.startTime.toSeconds(),
      currentRound?.votingDeadline.toSeconds()
    )
    const userProjects: Project[] = projects.filter(
      ({ address, requester }) =>
        isSameAddress(address, currentUser?.walletAddress) ||
        isSameAddress(requester as string, currentUser?.walletAddress)
    )
    this.projects = userProjects
  }

  navigateToProject(id: string): void {
    this.$emit('close')
    this.$router.push({ name: 'project', params: { id } })
  }

  onNavigateToBridge(): void {
    this.$emit('close')
  }

  async disconnect(): Promise<void> {
    if (this.currentUser && this.walletProvider) {
      // Log out user
      this.$web3.disconnectWallet()
      this.$store.dispatch(LOGOUT_USER)
      this.$emit('close')
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

h2 {
  font-family: Glacial Indifference;
  font-style: normal;
  font-weight: bold;
  font-size: 24px;
  line-height: 150%;
}

h2.no-margin {
  margin: 0;
}

p.no-margin {
  margin: 0;
}

.flex-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flex-end {
  justify-content: flex-end;
}

.wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  .modal-background {
    background: rgba(0, 0, 0, 0.7);
    position: fixed;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .container {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    background: var(--bg-light-color);
    padding: 1.5rem;
    box-sizing: border-box;
    width: clamp(min(414px, 100%), 35%, 500px);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    z-index: 2;
    overflow-y: scroll;

    .balances-section {
      img {
        filter: var(--img-filter, invert(0.7));
      }
    }

    .balances-card,
    .setup-card,
    .address-card {
      padding: 1rem;
      border-radius: 0.5rem;
      background: var(--bg-primary-color);
      gap: 1rem;
    }
    .address-card {
      background: var(--bg-gradient);

      .address {
        margin: 0;
        text-transform: uppercase;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .action-row {
        display: grid;
        gap: 0.5rem;
        grid-template-columns: auto 1fr auto;
        grid-template-areas: 'copy address disconnect';

        .copy {
          grid-area: copy;
        }
        .address {
          grid-area: address;
          align-items: center;
          overflow: hidden;
          text-overflow: ellipsis;
          align-self: center;
        }
        .disconnect {
          grid-area: disconnect;
        }
        .btn {
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          border: 1px solid var(--border-color);
          padding: 0.5rem;
          height: 2rem;
          width: 2rem;
          box-sizing: border-box;
          background: rgba(white, 0.1);
          &:hover {
            transform: scale(1.01);
            opacity: 0.8;
          }

          img {
            margin: 0;
            filter: var(--img-filter, invert(1));
          }
        }
      }
    }

    .complete-link {
      color: var(--text-color);
      text-decoration: underline;
      margin: 1rem 0;
      cursor: pointer;
      &:hover {
        transform: scale(1.01);
      }
    }

    .close-btn {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      cursor: pointer;
      &:hover {
        transform: scale(1.01);
      }

      img {
        filter: var(--img-filter, invert(1));
      }
    }

    .balances-card {
      padding: 0rem;
    }

    .project-item {
      display: flex;
      padding: 1rem 0;
      border-bottom: 1px solid rgba($highlight-color, 0.5);
      .project-thumbnail {
        width: 3rem;
        aspect-ratio: 1 / 1;
        object-fit: cover;
        border-radius: 0.5rem;
      }
      .project-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 0 1rem;

        .project-hidden {
          color: var(--error-color);
        }
      }
    }
  }
}
</style>
