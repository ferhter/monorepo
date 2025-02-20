<template>
  <div class="h100">
    <div v-if="!currentUser" class="empty-cart">
      <div class="moon-emoji">🌚</div>
      <h3>{{ $t('cart.h3_1') }}</h3>
      <wallet-widget :isActionButton="true" />
    </div>
    <div v-else class="cart-container">
      <div
        class="reallocation-message"
        v-if="$store.getters.canUserReallocate && $store.getters.hasUserVoted"
      >
        {{ $t('cart.div1') }}
        <links to="/about/maci" class="message-link">
          {{ $t('cart.link1') }}</links
        >
      </div>
      <div
        class="reallocation-message"
        v-if="$store.getters.canUserReallocate && !$store.getters.hasUserVoted"
      >
        {{ $t('cart.div2') }}
      </div>
      <div class="flex cart-title-bar">
        <div
          v-if="showCollapseCart"
          @click="toggleCart"
          class="absolute-left cart-btn"
        >
          <img alt="cart" width="16px" src="@/assets/cart.svg" />
          <img alt="close" width="16px" src="@/assets/chevron-right.svg" />
        </div>
        <h2>{{ isEditMode ? $t('cart.h2_1') : $t('cart.h2_2') }}</h2>
        <div
          v-if="
            ($store.getters.isRoundContributionPhase ||
              $store.getters.canUserReallocate) &&
            !isCartEmpty
          "
          class="absolute-right dropdown"
        >
          <img
            @click="openDropdown"
            class="dropdown-btn"
            src="@/assets/more.svg"
          />
          <div id="cart-dropdown" class="button-menu">
            <div
              v-for="({ callback, text, icon, cssClass }, idx) of dropdownItems"
              :key="idx"
              class="dropdown-item"
              @click="callback"
            >
              <img
                width="16px"
                :class="cssClass"
                :src="require(`@/assets/${icon}`)"
              />
              <p>{{ text }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="messages-and-cart-items">
        <div
          class="reallocation-intro"
          v-if="
            $store.getters.hasUserContributed &&
            $store.getters.hasReallocationPhaseEnded
          "
        >
          {{ $t('cart.div3') }}
        </div>
        <div class="cart">
          <div
            v-if="
              !$store.getters.hasUserContributed &&
              $store.getters.hasContributionPhaseEnded
            "
            class="empty-cart"
          >
            <div class="moon-emoji">🌚</div>
            <h3>{{ $t('cart.h3_2') }}</h3>
            <div>{{ $t('cart.div4') }}</div>
          </div>
          <div
            v-else-if="isCartEmpty && $store.getters.isRoundContributionPhase"
            class="empty-cart"
          >
            <div class="moon-emoji">🌚</div>
            <h3>{{ $t('cart.h3_3') }}</h3>
            <div>{{ $t('cart.div5') }}</div>
            <links to="/projects" class="btn-secondary mobile mt1">{{
              $t('cart.link2')
            }}</links>
          </div>
          <div v-else-if="$store.getters.canUserReallocate && !isCartEmpty">
            <div class="flex-row-reallocation">
              <div class="semi-bold">
                {{ isEditMode ? $t('cart.edit1') : $t('cart.edit2') }}
              </div>
              <div class="semi-bold" v-if="$store.getters.canUserReallocate">
                <button @click="handleEditState" class="pointer">
                  {{ isEditMode ? $t('cart.edit3') : $t('cart.edit4') }}
                </button>
              </div>
            </div>
          </div>
          <div
            v-else-if="$store.getters.hasUserContributed"
            class="flex-row-reallocation"
            id="readOnly"
          >
            <!-- Round is finalized -->
            <div>{{ $t('cart.div6') }}</div>
          </div>
          <cart-items
            v-if="
              $store.getters.hasUserContributed ||
              !$store.getters.hasContributionPhaseEnded
            "
            :cartList="filteredCart"
            :isEditMode="isEditMode"
            :isAmountValid="isAmountValid"
          />
        </div>
        <div
          v-if="
            ($store.getters.canUserReallocate && !isEditMode) ||
            ($store.getters.isRoundContributionPhase &&
              !$store.getters.canUserReallocate)
          "
          class="time-left-read-only"
        >
          <div class="caps">{{ $t('cart.div7') }}</div>
          <time-left :date="timeLeftDate" />
        </div>
      </div>
      <div
        class="reallocation-section"
        v-if="$store.getters.canUserReallocate && isEditMode"
      >
        <div class="reallocation-row">
          <span>{{ $t('cart.span1') }}</span>
          {{ formatAmount(this.contribution) }} {{ tokenSymbol }}
        </div>
        <div
          :class="
            this.isGreaterThanInitialContribution()
              ? 'reallocation-row-warning'
              : 'reallocation-row'
          "
        >
          <span>{{ $t('cart.span2') }}</span>
          <div class="reallocation-warning">
            <span v-if="this.isGreaterThanInitialContribution()">⚠️</span
            >{{ formatAmount(getCartTotal(this.$store.state.cart)) }}
            {{ tokenSymbol }}
          </div>
        </div>
        <div
          v-if="hasUnallocatedFunds()"
          class="reallocation-row-matching-pool"
        >
          <div>
            <div>
              <b>{{ $t('cart.div8') }}</b>
            </div>
            <div>{{ $t('cart.div9') }}</div>
          </div>
          + {{ formatAmount(this.contribution) - formatAmount(getTotal()) }}
          {{ tokenSymbol }}
        </div>
        <div
          @click="splitContributionsEvenly"
          class="split-link"
          v-if="
            this.isGreaterThanInitialContribution() || hasUnallocatedFunds()
          "
        >
          <img src="@/assets/split.svg" />
          {{
            $t('cart.div10', {
              contribution: formatAmount(this.contribution),
              tokenSymbol: tokenSymbol,
            })
          }}
        </div>
      </div>
      <div
        class="submit-btn-wrapper"
        v-if="canWithdrawContribution && cart.length >= 1"
      >
        <button class="btn-action" @click="withdrawContribution()">
          {{
            $t('cart.button1', {
              contribution: formatAmount(this.contribution),
              tokenSymbol: tokenSymbol,
            })
          }}
        </button>
      </div>
      <div
        class="submit-btn-wrapper"
        v-if="
          (($store.getters.canUserReallocate && isEditMode) ||
            (!$store.getters.canUserReallocate &&
              $store.getters.isRoundContributionPhase) ||
            !$store.getters.hasUserVoted) &&
          cart.length >= 1
        "
      >
        <div v-if="errorMessage" class="error-title">
          {{ $t('cart.div11') }}
          <span v-if="$store.getters.canUserReallocate">{{
            $t('cart.div11_if2')
          }}</span>
          <span v-else>{{ $t('cart.div11_if3') }}</span>
        </div>
        <div v-if="errorMessage" class="submit-error">
          {{ errorMessage }}
        </div>
        <div class="p1" v-if="hasUnallocatedFunds()">
          {{
            $t('cart.div12', {
              total: formatAmount(this.contribution) - formatAmount(getTotal()),
              tokenSymbol: tokenSymbol,
              contribution: formatAmount(this.contribution),
            })
          }}
        </div>
        <div class="p1" v-if="isBrightIdRequired">
          <links to="/verify" class="btn-primary"
            >{{ $t('cart.link3') }}
          </links>
        </div>
        <button
          v-if="!isCartEmpty"
          class="btn-action"
          @click="submitCart"
          :disabled="
            errorMessage ||
            ($store.getters.hasUserContributed &&
              $store.getters.hasUserVoted &&
              !isDirty)
          "
        >
          <template v-if="contribution.isZero()">
            {{
              $t('cart.template1', {
                total: formatAmount(getTotal()),
                tokenSymbol: tokenSymbol,
                cart: cart.length,
              })
            }}
          </template>
          <template v-else-if="!$store.getters.hasUserVoted">
            {{ $t('cart.template2') }}
          </template>
          <template v-else> {{ $t('cart.template3') }} </template>
        </button>
        <funds-needed-warning :onNavigate="toggleCart" :isCompact="true" />
        <div
          class="time-left"
          v-if="$store.getters.canUserReallocate && isEditMode"
        >
          <div class="caps">{{ $t('cart.div13') }}</div>
          <time-left :date="timeLeftDate" />
        </div>
      </div>
      <div
        class="line-item-bar"
        v-if="$store.getters.hasUserContributed && !isEditMode"
      >
        <div class="line-item">
          <span>{{ $t('cart.span3') }}</span>
          <div>
            <span
              >{{ formatAmount(getCartTotal($store.state.committedCart)) }}
              {{ tokenSymbol }}</span
            >
          </div>
        </div>
        <div class="line-item">
          <span>{{ $t('cart.span4') }}</span>
          <div>
            <span>{{ getCartMatchingPoolTotal() }} {{ tokenSymbol }}</span>
          </div>
        </div>
      </div>
      <div
        class="total-bar"
        v-if="
          $store.getters.isRoundContributionPhase ||
          ($store.getters.hasUserContributed &&
            $store.getters.hasContributionPhaseEnded)
        "
      >
        <span class="total-label">{{ $t('cart.span5') }}</span>
        <div>
          <span
            v-if="
              this.isGreaterThanInitialContribution() &&
              $store.getters.hasUserContributed
            "
            >{{ formatAmount(getCartTotal(this.$store.state.cart)) }} /
            <span class="total-reallocation">{{
              formatAmount(contribution)
            }}</span>
          </span>
          <span v-else>{{ formatAmount(getTotal()) }}</span>
          {{ tokenSymbol }}
        </div>
      </div>
      <div v-if="!$store.state.currentRound" class="reallocation-section">
        {{ $t('cart.div14') }}
        <links v-if="isBrightIdRequired" to="/verify">
          {{ $t('cart.link4') }}</links
        >
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { BigNumber } from 'ethers'
import { parseFixed } from '@ethersproject/bignumber'
import { DateTime } from 'luxon'
import WalletWidget from '@/components/WalletWidget.vue'
import ContributionModal from '@/components/ContributionModal.vue'
import ReallocationModal from '@/components/ReallocationModal.vue'
import WithdrawalModal from '@/components/WithdrawalModal.vue'
import CartItems from '@/components/CartItems.vue'
import Links from '@/components/Links.vue'
import TimeLeft from '@/components/TimeLeft.vue'
import { TOGGLE_EDIT_SELECTION, UPDATE_CART_ITEM } from '@/store/mutation-types'
import {
  MAX_CONTRIBUTION_AMOUNT,
  MAX_CART_SIZE,
  CartItem,
  isContributionAmountValid,
} from '@/api/contributions'
import { userRegistryType, UserRegistryType, chain } from '@/api/core'
import { RoundStatus } from '@/api/round'
import { LOGOUT_USER, SAVE_CART } from '@/store/action-types'
import { User } from '@/api/user'
import {
  CLEAR_CART,
  RESTORE_COMMITTED_CART_TO_LOCAL_CART,
  TOGGLE_SHOW_CART_PANEL,
} from '@/store/mutation-types'
import { formatAmount } from '@/utils/amounts'
import FundsNeededWarning from '@/components/FundsNeededWarning.vue'

@Component({
  components: {
    WalletWidget,
    CartItems,
    Links,
    TimeLeft,
    FundsNeededWarning,
  },
})
export default class Cart extends Vue {
  profileImageUrl: string | null = null

  removeAll(): void {
    this.$store.commit(CLEAR_CART)
    this.$store.dispatch(SAVE_CART)
    this.$store.commit(TOGGLE_EDIT_SELECTION, true)
  }

  dropdownItems: {
    callback: () => void | null
    text: string
    icon: string
    cssClass?: string
  }[] = [
    {
      callback: this.removeAll,
      text: this.translate('dynamic.cart.action.remove_all'),
      icon: 'remove.svg',
    },
    {
      callback: this.splitContributionsEvenly,
      text: this.translate('dynamic.cart.action.split_evenly'),
      icon: 'split.svg',
      cssClass: 'split-image',
    },
  ]

  get isEditMode(): boolean {
    const {
      isRoundContributionPhase,
      isRoundReallocationPhase,
      hasUserContributed,
    } = this.$store.getters

    if (isRoundContributionPhase && !hasUserContributed) {
      return true
    }

    if (
      (isRoundContributionPhase && hasUserContributed) ||
      isRoundReallocationPhase
    ) {
      return this.$store.state.cartEditModeSelected
    }

    return false
  }

  get isDirty(): boolean {
    const { committedCart } = this.$store.state

    return this.cart
      .filter((item) => !item.isCleared)
      .some((item: CartItem) => {
        const index = committedCart.findIndex((commitedItem: CartItem) => {
          return (
            item.id === commitedItem.id && item.amount === commitedItem.amount
          )
        })

        return index === -1
      })
  }

  private get cart(): CartItem[] {
    return this.$store.state.cart
  }

  handleEditState(): void {
    // When hitting cancel in edit mode, restore committedCart to local cart
    if (this.$store.state.cartEditModeSelected) {
      this.$store.commit(RESTORE_COMMITTED_CART_TO_LOCAL_CART)
    }
    this.$store.commit(TOGGLE_EDIT_SELECTION)
  }

  toggleCart(): void {
    this.$store.commit(TOGGLE_SHOW_CART_PANEL)
  }

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }

  get walletChainId(): number | null {
    return this.$web3.chainId
  }

  get supportedChainId(): number {
    return Number(process.env.VUE_APP_ETHEREUM_API_CHAINID)
  }

  isCorrectNetwork(): boolean {
    return this.supportedChainId === this.walletChainId
  }

  async mounted() {
    // TODO: refactor, move `chainChanged` and `accountsChanged` from here to an
    // upper level where we hear this events only once (there are other
    // components that do the same).
    this.$web3.$on('chainChanged', () => {
      if (this.currentUser) {
        // Log out user to prevent interactions with incorrect network
        this.$store.dispatch(LOGOUT_USER)
      }
    })

    let accounts: string[]
    this.$web3.$on('accountsChanged', (_accounts: string[]) => {
      if (_accounts !== accounts) {
        // Log out user if wallet account changes
        this.$store.dispatch(LOGOUT_USER)
      }
      accounts = _accounts
    })
  }

  get tokenSymbol(): string {
    const currentRound = this.$store.state.currentRound
    return currentRound ? currentRound.nativeTokenSymbol : ''
  }

  get contribution(): BigNumber {
    return this.$store.state.contribution || BigNumber.from(0)
  }

  get filteredCart(): CartItem[] {
    // Once reallocation phase ends, use committedCart for cart items
    if (this.$store.getters.hasReallocationPhaseEnded) {
      return this.$store.state.committedCart
    }
    // Hide cleared items
    return this.cart.filter((item) => !item.isCleared)
  }

  get isCartEmpty(): boolean {
    return (
      this.$store.state.currentUser &&
      this.$store.state.contribution !== null &&
      this.$store.state.contribution.isZero() &&
      this.filteredCart.length === 0
    )
  }

  formatAmount(value: BigNumber): string {
    const { nativeTokenDecimals } = this.$store.state.currentRound
    return formatAmount(value, nativeTokenDecimals)
  }

  isAmountValid(value: string): boolean {
    const currentRound = this.$store.state.currentRound
    return isContributionAmountValid(value, currentRound)
  }

  private isFormValid(): boolean {
    const invalidCount = this.cart.filter((item) => {
      return !item.isCleared && this.isAmountValid(item.amount) === false
    }).length
    return invalidCount === 0
  }

  public getCartMatchingPoolTotal(): string {
    return this.formatAmount(
      this.contribution.sub(this.getCartTotal(this.$store.state.committedCart))
    )
  }

  private getCartTotal(cart: Array<CartItem>): BigNumber {
    const { nativeTokenDecimals, voiceCreditFactor } =
      this.$store.state.currentRound
    return cart.reduce((total: BigNumber, item: CartItem) => {
      let amount
      try {
        amount = parseFixed(item.amount, nativeTokenDecimals)
      } catch {
        return total
      }
      return total.add(amount.div(voiceCreditFactor).mul(voiceCreditFactor))
    }, BigNumber.from(0))
  }

  getTotal(): BigNumber {
    const { cart } = this.$store.state
    const { hasUserContributed } = this.$store.getters

    return hasUserContributed ? this.contribution : this.getCartTotal(cart)
  }

  private isGreaterThanMax(): boolean {
    const decimals = this.$store.state.currentRound.nativeTokenDecimals
    const maxContributionAmount = BigNumber.from(10)
      .pow(BigNumber.from(decimals))
      .mul(MAX_CONTRIBUTION_AMOUNT)
    return this.getTotal().gt(maxContributionAmount)
  }

  private isGreaterThanInitialContribution(): boolean {
    return this.getCartTotal(this.$store.state.cart).gt(this.contribution)
  }

  get errorMessage(): string | null {
    const currentUser = this.$store.state.currentUser
    const currentRound = this.$store.state.currentRound
    if (this.$store.getters.isMessageLimitReached)
      return this.translate('dynamic.cart.error.reached_contribution_limit')
    if (!currentUser) return this.translate('dynamic.cart.error.connect_wallet')
    if (!this.isCorrectNetwork())
      return this.translate('incorrect_network', { chain: chain.label })
    if (this.isBrightIdRequired)
      return this.translate('dynamic.cart.error.need_to_setup_brightid')
    if (!this.isFormValid())
      return this.translate('dynamic.cart.error.invalid_contribution_amount')
    if (this.cart.length > MAX_CART_SIZE)
      return this.translate('dynamic.cart.error.exceeded_max_cart_size', {
        maxCartSize: MAX_CART_SIZE,
      })
    if (currentRound.status === RoundStatus.Cancelled)
      return this.translate('dynamic.cart.error.round_cancelled')
    if (this.$store.getters.hasReallocationPhaseEnded)
      return this.translate('dynamic.cart.error.round_ended')
    if (currentRound.messages + this.cart.length >= currentRound.maxMessages)
      return this.translate('dynamic.cart.error.cart_changes_exceed_cap')
    else if (
      currentRound.messages + this.cart.length >=
      currentRound.maxMessages
    ) {
      return this.translate('dynamic.cart.error.reached_contribution_limit')
    } else {
      const total = this.getTotal()
      if (this.contribution.isZero()) {
        // Contributing
        if (DateTime.local() >= currentRound.signUpDeadline) {
          return this.translate('dynamic.cart.error.contributions_over')
          // the above error might not be necessary now we have our cart states in the HTML above
        } else if (currentRound.contributors >= currentRound.maxContributors) {
          return this.translate('dynamic.cart.error.reached_contributor_limit')
        } else if (total.eq(BigNumber.from(0)) && !this.isCartEmpty) {
          return this.translate('dynamic.cart.error.must_be_gt_zero', {
            nativeTokenSymbol: currentRound.nativeTokenSymbol,
          })
        } else if (currentUser.balance === null) {
          return '' // No error: waiting for balance
        } else if (total.gt(currentUser.balance)) {
          const balanceDisplay = formatAmount(
            currentUser.balance,
            currentRound.nativeTokenDecimals
          )
          return this.translate('dynamic.cart.error.not_enough_funds', {
            balance: balanceDisplay,
            nativeTokenSymbol: currentRound.nativeTokenSymbol,
          })
        } else if (this.isGreaterThanMax()) {
          return this.translate('dynamic.cart.error.too_generous', {
            maxAmount: MAX_CONTRIBUTION_AMOUNT,
            nativeTokenSymbol: currentRound.nativeTokenSymbol,
          })
        } else if (parseInt(currentUser.etherBalance) === 0) {
          return this.translate('dynamic.cart.error.need_gas_payment')
        } else {
          return null
        }
      } else {
        // Reallocating funds
        if (!this.$store.state.contributor) {
          return this.translate('dynamic.cart.error.contributor_key_missing')
        } else if (this.isGreaterThanInitialContribution()) {
          return this.translate(
            'dynamic.cart.error.more_than_original_contribution',
            {
              total: this.formatAmount(this.contribution),
              tokenSymbol: this.tokenSymbol,
            }
          )
        } else {
          return null
        }
      }
    }
  }

  hasUnallocatedFunds(): boolean {
    return (
      this.errorMessage === null &&
      !this.contribution.isZero() &&
      this.getTotal().lt(this.contribution)
    )
  }

  get isBrightIdRequired(): boolean {
    return (
      userRegistryType === UserRegistryType.BRIGHT_ID &&
      !this.currentUser?.isRegistered
    )
  }

  translate(key: string, params?: any): string {
    return this.$t(key, params).toString()
  }

  submitCart(event) {
    event.preventDefault()
    const { nativeTokenDecimals, voiceCreditFactor } =
      this.$store.state.currentRound
    const votes = this.cart.map((item: CartItem) => {
      const amount = parseFixed(item.amount, nativeTokenDecimals)
      const voiceCredits = amount.div(voiceCreditFactor)
      return [item.index, voiceCredits]
    })
    this.$modal.show(
      this.contribution.isZero() || !this.$store.getters.hasUserVoted
        ? ContributionModal
        : ReallocationModal,
      { votes },
      {
        width: 500,
        clickToClose:
          this.contribution.isZero() || !this.$store.getters.hasUserVoted,
      }
    )
    this.$store.commit(TOGGLE_EDIT_SELECTION, false)
  }

  get canWithdrawContribution(): boolean {
    return (
      this.$store.state.currentRound?.status === RoundStatus.Cancelled &&
      !this.contribution.isZero()
    )
  }

  withdrawContribution(): void {
    this.$modal.show(WithdrawalModal)
  }

  get showCollapseCart(): boolean {
    return this.$route.name !== 'cart'
  }

  openDropdown(): void {
    document.getElementById('cart-dropdown')?.classList.toggle('show')
  }

  splitContributionsEvenly(): void {
    this.$store.commit(TOGGLE_EDIT_SELECTION, true)

    const { cart } = this.$store.state
    const filteredCart = cart.filter((item) => !item.isCleared) // Filter out isCleared cart items for accurate split
    const total = this.$store.getters.canUserReallocate
      ? this.formatAmount(this.contribution)
      : filteredCart.reduce((acc, curr) => (acc += parseFloat(curr.amount)), 0)
    const splitAmount = total / filteredCart.length
    // Each iteration subtracts from the totalRemaining until the last round to accomodate for decimal rounding. ex 10/3
    let totalRemaining = Number(total)

    filteredCart.map((item: CartItem, index: number) => {
      if (filteredCart.length - 1 === index) {
        this.$store.commit(UPDATE_CART_ITEM, {
          ...item,
          amount: parseFloat(totalRemaining.toFixed(5)).toString(),
        })
      } else {
        this.$store.commit(UPDATE_CART_ITEM, {
          ...item,
          amount: parseFloat(splitAmount.toFixed(5)).toString(),
        })
        totalRemaining -= Number(splitAmount.toFixed(5))
      }
    })
    this.$store.dispatch(SAVE_CART)
  }

  get timeLeftDate(): DateTime {
    return this.$store.getters.canUserReallocate
      ? this.$store.state.currentRound.votingDeadline
      : this.$store.state.currentRound.signUpDeadline
  }
}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function (event) {
  if (!event.target.matches('.dropdown-btn')) {
    const dropdowns = document.getElementsByClassName('button-menu')
    let i: number
    for (i = 0; i < dropdowns.length; i++) {
      const openDropdown = dropdowns[i]
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show')
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

h2 {
  line-height: 130%;
}

.cart-container {
  box-sizing: border-box;
  position: relative;
  gap: 1rem;
  height: 100%;
  padding: 1rem 0rem;
  padding-top: 0rem;
  width: 100%;
  border-left: 1px solid #000;

  @media (max-width: $breakpoint-m) {
    padding: 0rem;
  }
  @media (max-width: $breakpoint-s) {
    padding: 1rem 0rem;
    margin-bottom: 3rem;
  }
}

.balance {
  font-size: 16px;
  font-weight: 600;
  font-family: 'Glacial Indifference', sans-serif;
}

.reallocation-intro {
  padding: 1rem;
  padding-top: 0rem;
  margin-bottom: 1rem;
  font-size: 14px;
}

.profile-info-round {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.5rem;
  width: 100%;
}

.profile-info-balance img {
  height: 16px;
  width: 16px;
}

.button-container {
  width: 100%;
  padding: 0rem 1rem;
}

.time-left {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
  margin-top: 1rem;
}

.time-left-read-only {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 1rem;
}

.cart-title-bar {
  position: sticky;
  padding: 1rem;
  top: 0;
  z-index: 1;
  @media (max-width: $breakpoint-m) {
    justify-content: space-between;
  }
  & > h2 {
    margin: 0;
    width: 100%;
    text-align: center;
    @media (max-width: $breakpoint-m) {
      margin-left: 1rem;
    }
  }
}

.flex-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0rem 1rem;
}

.semi-bold {
  font-weight: 500;
  font-size: 14px;
  button {
    font-family: 'Inter';
    font-weight: 500;
    font-size: 14px;
    color: var(--text-color);
    border: 0;
    background: none;
    text-decoration: underline;
  }
}

.flex {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.flex-row-reallocation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0rem 1rem;
  margin: 1rem 0;
}

.absolute-left {
  /* position: absolute;
  left: 0; */
  /* margin-left: 1rem; */
}

.absolute-right {
  position: absolute;
  right: 1rem;
}

.cart-btn {
  @include button(
    white,
    var(--bg-light-color),
    1px solid rgba($border-light, 0.3)
  );
  border: 0px solid var(--text-color);
  background: transparent;
  padding: 0.75rem 0.5rem;
  border-radius: 0.5rem;
  display: flex;
  gap: 0.5rem;
  margin-right: -0.5rem;
  &:hover {
    background: var(--bg-secondary-color);
    gap: 0.75rem;
    margin-right: -0.75rem;
  }

  img {
    filter: var(--img-filter, invert(0.7));
  }
}

.cart {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.empty-cart {
  font-size: 16px;
  font-weight: 400;
  margin: 1rem;
  padding: 1.5rem 1.5rem;

  img {
    height: 70px;
  }

  h3 {
    font-family: 'Glacial Indifference', sans-serif;
    font-size: 25px;
    font-weight: 700;
  }

  div {
    color: var(--text-color-cart);
  }
}

.line-item-bar {
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  padding: 1rem 0;
  background: var(--bg-primary-color);
  font-family: 'Inter';
  font-size: 1rem;
  line-height: 0;
  font-weight: 400;
}

.line-item {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 1rem;
}

.total-bar {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  position: sticky;
  bottom: 0;
  padding: 1rem;
  justify-content: space-between;
  border-top: 1px solid #000;
  border-bottom: 1px solid #000;
  font-family: 'Inter';
  font-size: 1rem;
  line-height: 0;
  font-weight: 400;
  height: 60px;
  @media (max-width: $breakpoint-m) {
    position: fixed;
    bottom: 4rem;
    width: 100%;
  }
  @media (max-width: $breakpoint-s) {
    position: fixed;
    bottom: 4rem;
    width: 100%;
    padding: 1rem;
  }
}

.total-reallocation {
  font-family: 'Inter';
  font-size: 1rem;
  line-height: 0;
  font-weight: 700;
}

.total-label {
  font-family: 'Glacial Indifference', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 0;
  margin-right: 0.5rem;
}

.reallocation-message {
  padding: 1rem;
  background: $highlight-color;
  font-size: 14px;
}

.message-link {
  color: var(--text-color);
  text-decoration: underline;
}

.balance {
  padding: 1rem;
  background: var(--bg-primary-color);
  border-bottom: 1px solid #000000;
  border-top: 1px solid #000000;
  display: flex;
  justify-content: space-between;
}

.close-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  &:hover {
    transform: scale(1.01);
  }
}

.submit-btn-wrapper {
  align-self: flex-end;
  box-sizing: border-box;
  border-top: 1px solid #000000;
  text-align: left;
  gap: 0.5rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 1rem;
  position: relative;
  background: var(--bg-secondary-color);
  @media (max-width: $breakpoint-m) {
    padding: 2rem;
  }

  .error-title {
    text-align: left;
    color: var(--attention-color);
    :after {
      content: ' ⚠️';
    }
  }

  .submit-error {
    margin-bottom: 1rem;
  }

  .btn-action {
    padding-left: 0;
    padding-right: 0;
    width: 100%;
  }
}

.h100 {
  height: 100%;
}

.p1 {
  width: 100%;
  margin-bottom: 1rem;
}

.mt1 {
  margin-top: 1rem;
  width: fit-content;
}

.ml1 {
  margin-left: 1rem;
}

.moon-emoji {
  font-size: 4rem;
}

.reallocation-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
  span {
    font-size: 14px;
    font-weight: 600;
  }
}

.reallocation-row-warning {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
  color: var(--attention-color);
  span {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-color);
  }
}

.reallocation-warning {
  span {
    color: var(--attention-color);
    margin-right: 0.25rem;
  }
}

.split-link {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  text-decoration: underline;
  cursor: pointer;
  justify-content: flex-end;
  &:hover {
    opacity: 0.8;
    transform: scale(1.01);
  }

  img {
    filter: var(--img-filter, invert(1));
  }
}

.reallocation-row-matching-pool {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-weight: 600;
  font-size: 16px;
  color: $clr-green;
  div {
    font-size: 14px;
    font-weight: 400;
    color: #fff;
    padding: 0.125rem 0;
  }
}

.reallocation-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #000;
}

.dropdown {
  position: relative;
  display: inline-block;

  img.dropdown-btn {
    margin: 0;
    filter: var(--img-filter, invert(1));
  }

  .button-menu {
    display: none;
    flex-direction: column;
    position: absolute;
    top: 2rem;
    right: 0.5rem;
    background: var(--bg-secondary-color);
    border: 1px solid rgba($border-light, 0.3);
    border-radius: 0.5rem;
    min-width: 160px;
    box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
    z-index: 1;
    cursor: pointer;
    overflow: hidden;

    .dropdown-item {
      display: flex;
      align-items: center;
      padding: 0.25rem;
      padding-left: 1rem;
      gap: 0.5rem;
      color: var(--text-color);
      &:hover {
        background: var(--bg-light-color);
      }

      .item-text {
        margin: 0;
        color: var(--text-color);
      }

      .split-image {
        filter: var(--img-filter, invert(1));
      }
    }
  }

  .show {
    display: flex;
  }
}

.flex {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
