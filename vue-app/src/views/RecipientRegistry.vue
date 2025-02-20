<template>
  <div class="recipients">
    <div class="title">
      <div class="header">
        <h2>{{ $t('recipientRegistry.h2') }}</h2>
      </div>
      <div class="hr" />
    </div>
    <loader v-if="isLoading" />
    <div v-else>
      <button
        v-if="hasPendingRequests"
        class="btn-secondary desktop btn-export"
        @click="handleExport"
      >
        Export pending submissions
      </button>
      <table class="requests">
        <thead>
          <tr>
            <th>{{ $t('recipientRegistry.th1') }}</th>
            <th>{{ $t('recipientRegistry.th2') }}</th>
            <th>{{ $t('recipientRegistry.th3') }}</th>
            <th>{{ $t('recipientRegistry.th4') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="request in requests.slice().reverse()"
            :key="request.recipientId"
          >
            <td>
              <div class="project-name">
                <links
                  v-if="request.metadata.thumbnailImageUrl"
                  :to="request.metadata.thumbnailImageUrl"
                >
                  <img
                    class="project-image"
                    :src="request.metadata.thumbnailImageUrl"
                  />
                </links>
                {{ request.metadata.name }}
                <links
                  v-if="hasProjectLink(request)"
                  :to="{
                    name: 'project',
                    params: { id: request.recipientId },
                  }"
                  >-></links
                >
              </div>
              <details class="project-details">
                <summary>{{ $t('recipientRegistry.summary') }}</summary>

                <div>
                  <div class="btn-row">
                    {{ $t('recipientRegistry.div1') }}
                    <copy-button
                      :value="request.transactionHash"
                      :text="$t('recipientRegistry.btn1')"
                      myClass="inline copy-icon"
                    />
                  </div>
                  <code>{{ request.transactionHash }}</code>
                </div>
                <div>
                  <div class="btn-row">
                    {{ $t('recipientRegistry.div2') }}
                    <copy-button
                      :value="request.recipientId"
                      :text="$t('recipientRegistry.btn2')"
                      myClass="inline
                    copy-icon"
                    />
                  </div>
                  <code>{{ request.recipientId }}</code>
                </div>
                <div>
                  <div class="btn-row">
                    {{ $t('recipientRegistry.div3') }}
                    <copy-button
                      :value="request.recipient"
                      :text="$t('recipientRegistry.btn3')"
                      myClass="copy-icon"
                    />
                  </div>
                  <code>{{ request.recipient }}</code>
                </div>
              </details>
            </td>
            <td>{{ request.type }}</td>
            <td>
              <template v-if="hasProjectLink(request)">
                <links
                  :to="{
                    name: 'project',
                    params: { id: request.recipientId },
                  }"
                >
                  {{ request.status }}
                </links>
              </template>
              <template v-else>
                {{ request.status }}
              </template>
            </td>
            <td>
              <div class="actions" v-if="isUserConnected">
                <!-- TODO: to implement this feature, it requires to send a baseDeposit (see contract)
              <div
                class="btn-warning"
                @click="remove(request)"
                v-if="isExecuted(request)"
              >
                Remove
              </div> -->
                <div
                  class="icon-btn-approve"
                  v-if="(isOwner && isPending(request)) || isAccepted(request)"
                  @click="approve(request)"
                >
                  <img src="@/assets/checkmark.svg" />
                </div>
                <div
                  class="icon-btn-reject"
                  v-if="isOwner && (isPending(request) || isAccepted(request))"
                  @click="reject(request)"
                >
                  <img src="@/assets/close.svg" />
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { BigNumber } from 'ethers'
import * as humanizeDuration from 'humanize-duration'
import { DateTime } from 'luxon'
import CopyButton from '@/components/CopyButton.vue'

import { chainId, exportBatchSize, recipientRegistryType } from '@/api/core'
import {
  RequestType,
  RequestStatus,
  Request,
  getRequests,
  registerProject,
  rejectProject,
  removeProject,
} from '@/api/recipient-registry-optimistic'
import Loader from '@/components/Loader.vue'
import Links from '@/components/Links.vue'
import { formatAmount } from '@/utils/amounts'
import { markdown } from '@/utils/markdown'
import { LOAD_RECIPIENT_REGISTRY_INFO } from '@/store/action-types'
import { RegistryInfo } from '@/api/recipient-registry-optimistic'
import TransactionModal from '@/components/TransactionModal.vue'

@Component({ components: { CopyButton, Loader, Links } })
export default class RecipientRegistryView extends Vue {
  requests: Request[] = []
  isLoading = true

  async created() {
    if (recipientRegistryType !== 'optimistic') {
      return
    }

    await this.$store.dispatch(LOAD_RECIPIENT_REGISTRY_INFO)
    await this.loadRequests()
    this.isLoading = false
  }

  get isOwner() {
    return this.$store.getters.isRecipientRegistryOwner
  }

  get isUserConnected(): boolean {
    return !!this.$store.state.currentUser
  }

  async loadRequests() {
    const { recipientRegistryInfo, recipientRegistryAddress } =
      this.$store.state
    const requests = await getRequests(
      recipientRegistryInfo,
      recipientRegistryAddress
    )

    this.requests = requests.filter((req) => Boolean(req.requester))
  }

  get registryInfo(): RegistryInfo {
    return this.$store.state.recipientRegistryInfo
  }

  formatAmount(value: BigNumber): string {
    return formatAmount(value, 18)
  }

  formatDuration(seconds: number): string {
    return humanizeDuration(seconds * 1000)
  }

  formatDate(date: DateTime): string {
    return date.toLocaleString(DateTime.DATETIME_SHORT)
  }

  renderDescription(request: Request): string {
    return markdown.render(request.metadata.description)
  }

  isPending(request: Request): boolean {
    return request.status === RequestStatus.Submitted
  }

  isAccepted(request: Request): boolean {
    return request.status === RequestStatus.Accepted
  }

  isRejected(request: Request): boolean {
    return request.status === RequestStatus.Rejected
  }

  isExecuted(request: Request): boolean {
    return request.status === RequestStatus.Executed
  }

  hasProjectLink(request: Request): boolean {
    return (
      request.type === RequestType.Registration &&
      request.status === RequestStatus.Executed
    )
  }

  async approve(request: Request): Promise<void> {
    const { recipientRegistryAddress, currentUser } = this.$store.state
    const signer = currentUser.walletProvider.getSigner()

    await this.waitForTransactionAndLoad(
      registerProject(recipientRegistryAddress, request.recipientId, signer)
    )
  }

  async reject(request: Request): Promise<void> {
    const { recipientRegistryAddress, currentUser } = this.$store.state
    const signer = currentUser.walletProvider.getSigner()

    await this.waitForTransactionAndLoad(
      rejectProject(
        recipientRegistryAddress,
        request.recipientId,
        request.requester,
        signer
      )
    )
  }

  async remove(request: Request): Promise<void> {
    const { recipientRegistryAddress, currentUser } = this.$store.state
    const signer = currentUser.walletProvider.getSigner()

    await this.waitForTransactionAndLoad(
      removeProject(recipientRegistryAddress, request.recipientId, signer)
    )
  }

  async waitForTransactionAndLoad(transaction) {
    this.$modal.show(
      TransactionModal,
      {
        transaction,
        onTxSuccess: async () => {
          // TODO: this is not ideal. Leaving as is, just because it is an admin
          // page where no end user is using. We are forcing this 2s time to give
          // time the subgraph to index the new state from the tx. Perhaps we could
          // avoid querying the subgraph and query directly the chain to get the
          // request state.
          await new Promise((resolve) => {
            setTimeout(async () => {
              await this.loadRequests()
              resolve()
            }, 2000)
          })
        },
      },
      {},
      {}
    )
  }

  async copyAddress(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      /* eslint-disable-next-line no-console */
      console.warn('Error in copying text: ', error)
    }
  }

  private get challengeRequestAbi(): any {
    return {
      inputs: [
        {
          internalType: 'bytes32',
          name: '_recipientId',
          type: 'bytes32',
        },
        {
          internalType: 'address payable',
          name: '_beneficiary',
          type: 'address',
        },
      ],
      name: 'challengeRequest',
      payable: false,
    }
  }

  private createExportUrl(requests: Request[]): string {
    const { recipientRegistryAddress } = this.$store.state

    const transactions = requests.map((req) => {
      return {
        to: recipientRegistryAddress,
        value: '0',
        data: null,
        contractMethod: this.challengeRequestAbi,
        contractInputsValues: {
          _recipientId: req.recipientId,
          _beneficiary: req.requester,
        },
      }
    })

    const data = {
      version: '1.0',
      chainId,
      createdAt: Date.now(),
      meta: {
        name: 'Pending Submissions',
        txBuilderVersion: '1.11.1',
      },
      transactions,
    }

    return 'data:application/json,' + encodeURIComponent(JSON.stringify(data))
  }

  private exportFile(url: string, filename: string): void {
    const anchor = document.createElement('a')
    anchor.setAttribute('href', url)
    anchor.setAttribute('download', filename)
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  }

  handleExport(): void {
    const pendingRequests = this.requests.filter((req) => this.isPending(req))

    let count = 1
    for (let i = 0; i < pendingRequests.length; i = i + exportBatchSize) {
      const end = i + exportBatchSize
      const chunk = pendingRequests.slice(i, end)
      const url = this.createExportUrl(chunk)
      const filename = `pending-submission-${count}.json`
      this.exportFile(url, filename)
      count++
    }
  }

  get hasPendingRequests(): boolean {
    const pendingRequests = this.requests.filter((req) => this.isPending(req))
    return pendingRequests.length > 0
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.title {
  display: grid;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 0 !important;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-right: auto;
    h2 {
      line-height: 130%;
      margin: 0;
    }
  }

  .hr {
    width: 100%;
    border-bottom: 1px solid $border-light;
  }
}

.requests {
  border: 1px solid var(--border-strong);
  border-radius: 0.5rem;
  border-spacing: 0;
  line-height: 150%;
  table-layout: fixed;
  width: 100%;
  background-color: var(--bg-light-color);

  thead {
    background-color: var(--bg-primary-color);
    border-radius: 6px;
  }

  tr {
    &:nth-child(2n) {
      background-color: var(--bg-secondary-color);
    }
  }

  th,
  td {
    overflow: hidden;
    padding: $content-space / 2;
    text-align: left;
    text-overflow: ellipsis;

    &:nth-child(1) {
      width: 25%;
      word-wrap: break-word;
    }

    .actions {
      display: flex;
    }

    .project-name {
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .project-image {
      height: 1rem;
      margin-right: 0.25rem;
      vertical-align: middle;
    }

    .project-details {
      margin-top: 0.5rem;
      font-size: 14px;
      margin-left: 0.5rem;

      div {
        margin: 0.5rem 0;
        font-weight: 500;
        margin-left: 1rem;
        div {
          margin: 0;
        }
      }
    }
  }

  .icon-btn-approve {
    line-height: 0;
    margin: 0;
    border-radius: 0.5rem;
    width: 1rem;
    height: 1rem;
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--bg-light-color);
    background: rgba($clr-green, 0.6);
    cursor: pointer;
    &:hover {
      transform: scale(1.1);
      opacity: 0.8;
    }
  }

  .icon-btn-reject {
    line-height: 0;
    margin: 0;
    border-radius: 0.5rem;
    width: 1rem;
    height: 1rem;
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--bg-light-color);
    background: var(--error-color);
    cursor: pointer;
    &:hover {
      transform: scale(1.1);
      opacity: 0.8;
    }
  }

  .btn-row {
    display: flex;
    gap: 0.5rem;
  }
}

@media (max-width: 600px) {
  .requests th,
  .requests td {
    &:nth-child(n + 2) {
      width: auto;
    }
  }
}

.btn-export {
  max-width: fit-content;
}
</style>
