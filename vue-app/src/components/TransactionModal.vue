<template>
  <div class="modal-body">
    <transaction
      :hash="txHash"
      :error="txError"
      :displayRetryBtn="true"
      @close="$emit('close')"
      @retry="
        () => {
          this.txError = ''
          executeTx()
        }
      "
    ></transaction>
    <button
      v-if="txHash"
      class="btn-secondary close-btn"
      @click="$emit('close')"
    >
      {{ $t('transactionModal.button1') }}
    </button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { TransactionResponse } from '@ethersproject/abstract-provider'

import Transaction from '@/components/Transaction.vue'
import { waitForTransaction } from '@/utils/contracts'

@Component({
  components: {
    Transaction,
  },
})
export default class TransactionModal extends Vue {
  @Prop() transaction!: Promise<TransactionResponse>
  @Prop() onTxSuccess!: (txHash) => void

  txHash = ''
  txError = ''

  mounted() {
    this.executeTx()
  }

  private async executeTx() {
    try {
      await waitForTransaction(this.transaction, (hash) => (this.txHash = hash))

      this.onTxSuccess(this.txHash)
    } catch (error) {
      this.txError = error.message
      return
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.modal-body {
  text-align: left;
  background: var(--bg-secondary-color);
  border-radius: 1rem;
  box-shadow: var(--box-shadow);
  padding: 1.5rem;
}

.close-btn {
  margin-top: $modal-space;
}
</style>
