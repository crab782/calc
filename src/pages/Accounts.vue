<template>
  <div class="accounts-page">
    <div class="accounts-header">
      <h4 class="accounts-title">{{ t.accounts.title }}</h4>
      <el-button type="primary" size="small" @click="showAddModal = true">
        <el-icon><Plus /></el-icon>
        {{ t.accounts.addAccount }}
      </el-button>
    </div>

    <template v-if="visibleAccounts.length === 0">
      <div class="empty-wrapper">
        <span>{{ t.accounts.noAccounts }}</span>
      </div>
    </template>
    <template v-else>
      <el-collapse v-model="activeCollapseKeys" class="accounts-collapse">
        <el-collapse-item
          v-for="currency in accountsByCurrency.currencies"
          :key="currency"
          :name="currency"
        >
          <template #title>
            <div class="collapse-header">
              <strong>{{ currency === 'CNY' ? '本币账户' : `${currency} 账户` }}</strong>
              <span class="secondary-text">({{ accountsByCurrency.groups[currency]?.length }})</span>
            </div>
          </template>
          <el-table :data="accountsByCurrency.groups[currency]" row-key="id" size="small">
            <el-table-column prop="name" label="名称" width="150">
              <template #default="{ row }">
                <span class="account-name-cell">
                  <el-icon :size="16" color="#1677ff"><Wallet /></el-icon>
                  <strong>{{ row.name }}</strong>
                  <el-tag v-if="row.isDefault" size="small" type="primary">
                    {{ t.accounts.defaultAccountLabel }}
                  </el-tag>
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="accountType" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="typeColorMap[row.accountType] || 'info'">
                  {{ ACCOUNT_TYPE_NAMES[row.accountType] || row.accountType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="currency" label="币种" width="80" />
            <el-table-column label="余额" width="150">
              <template #default="{ row }">
                <span :class="getBalanceClass(row)">
                  {{ CURRENCY_SYMBOLS[row.currency] || '' }}{{ formatBalance(row) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-space size="small">
                  <el-button type="primary" text size="small" @click="handleOpenEdit(row)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-popconfirm
                    :title="t.accounts.deleteConfirm"
                    :description="t.accounts.deleteMessage"
                    @confirm="handleDeleteAccount(row.id)"
                    confirm-button-type="danger"
                  >
                    <template #reference>
                      <el-button type="danger" text size="small">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </template>
                  </el-popconfirm>
                </el-space>
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </template>

    <!-- Add Account Modal -->
    <el-dialog
      v-model="showAddModal"
      :title="t.accounts.addAccount"
      width="450px"
    >
      <el-form ref="addFormRef" :model="addFormData" label-position="top" style="margin-top: 16px">
        <el-form-item :label="'账户名称'" prop="name">
          <el-input
            v-model="addFormData.name"
            :placeholder="`例如：${addFormData.currency} ${ACCOUNT_TYPE_NAMES[addFormData.accountType]}`"
          />
        </el-form-item>
        <el-form-item :label="'币种'" prop="currency">
          <el-select v-model="addFormData.currency" @change="onCurrencyChange" style="width: 100%">
            <el-option
              v-for="opt in CURRENCY_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="'账户类型'" prop="accountType">
          <el-select v-model="addFormData.accountType" @change="onTypeChange" style="width: 100%">
            <el-option
              v-for="opt in ACCOUNT_TYPE_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelAddAccount">{{ t.accounts.cancel }}</el-button>
        <el-button type="primary" @click="handleAddAccount">{{ t.accounts.confirm }}</el-button>
      </template>
    </el-dialog>

    <!-- Edit Account Modal -->
    <el-dialog
      v-model="showEditModal"
      :title="t.accounts.editAccount"
      width="450px"
    >
      <div class="edit-form">
        <div class="form-group">
          <strong class="form-label">{{ t.accounts.editAccountName }}</strong>
          <el-input
            v-model="editName"
            :placeholder="t.accounts.editAccountNamePlaceholder"
            autofocus
            @keyup.enter="handleSaveEdit"
          />
        </div>
        <div class="form-group">
          <strong class="form-label">{{ t.accounts.editAccountBalance }}</strong>
          <el-input
            v-model="editBalance"
            type="number"
            :placeholder="t.accounts.editAccountBalancePlaceholder"
            @keyup.enter="handleSaveEdit"
          />
        </div>
        <div class="form-group">
          <strong class="form-label">{{ t.accounts.currency }}</strong>
          <span class="secondary-text">{{ editingAccount?.currency }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showEditModal = false">{{ t.accounts.cancel }}</el-button>
        <el-button type="primary" :disabled="!editName.trim()" @click="handleSaveEdit">
          {{ t.accounts.confirm }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import type { FormInstance } from 'element-plus'
import { Wallet, Plus, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useLanguage } from '../composables/useLanguage'
import { useRecords } from '../composables/useRecords'
import type { Account } from '../types/record'

const { t } = useLanguage()
const { accounts, records, addAccount, deleteAccount, updateAccount } = useRecords()

const showAddModal = ref(false)
const showEditModal = ref(false)
const addFormData = reactive({
  currency: 'CNY',
  accountType: 'cash' as 'cash' | 'investment' | 'loan',
  name: '',
})
const addFormRef = ref<FormInstance>()
const editName = ref('')
const editBalance = ref('')

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'cash', label: '现金' },
  { value: 'investment', label: '投资' },
  { value: 'loan', label: '贷款' },
]

const ACCOUNT_TYPE_NAMES: Record<string, string> = {
  cash: '现金',
  investment: '投资',
  loan: '贷款',
}

const CURRENCY_OPTIONS = [
  { value: 'CNY', label: 'CNY (¥)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'JPY', label: 'JPY (¥)' },
]

const CURRENCY_SYMBOLS: Record<string, string> = {
  CNY: '¥',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
}

const typeColorMap: Record<string, 'success' | 'primary' | 'warning' | 'info'> = {
  cash: 'success',
  investment: 'primary',
  loan: 'warning',
}

const visibleAccounts = computed(() =>
  accounts.value.filter(
    acc => acc.visible === true && ['cash', 'investment', 'loan'].includes(acc.accountType)
  )
)

const accountsByCurrency = computed(() => {
  const grouped: Record<string, Account[]> = {}
  visibleAccounts.value.forEach(acc => {
    if (!grouped[acc.currency]) grouped[acc.currency] = []
    grouped[acc.currency].push(acc)
  })
  Object.keys(grouped).forEach(currency => {
    const defaultAccount = grouped[currency].find(acc => acc.isDefault)
    const otherAccounts = grouped[currency].filter(acc => !acc.isDefault)
    grouped[currency] = [...(defaultAccount ? [defaultAccount] : []), ...otherAccounts]
  })
  const sortedCurrencies = Object.keys(grouped).sort((a, b) => {
    if (a === 'CNY') return -1
    if (b === 'CNY') return 1
    return a.localeCompare(b)
  })
  return { currencies: sortedCurrencies, groups: grouped }
})

const accountBalances = computed(() => {
  const balances: Record<string, number> = {}
  accounts.value.forEach(acc => { balances[acc.id] = 0 })
  records.value.forEach(record => {
    record.entries?.forEach(entry => {
      if (!balances[entry.accountId]) balances[entry.accountId] = 0
      if (entry.direction === 'debit') balances[entry.accountId] += entry.amount
      else balances[entry.accountId] -= entry.amount
    })
  })
  return balances
})

const activeCollapseKeys = computed(() => accountsByCurrency.value.currencies)

const formatBalance = (account: Account) => {
  const bal = accountBalances.value[account.id] ?? 0
  return bal.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

const getBalanceClass = (account: Account) => {
  const bal = accountBalances.value[account.id] ?? 0
  return bal >= 0 ? '' : 'negative-balance'
}

const onCurrencyChange = (value: string) => {
  addFormData.currency = value
}

const onTypeChange = (value: 'cash' | 'investment' | 'loan') => {
  addFormData.accountType = value
}

const handleAddAccount = async () => {
  const result = addAccount({
    currency: addFormData.currency,
    accountType: addFormData.accountType,
    name: addFormData.name?.trim() || `${addFormData.currency} ${ACCOUNT_TYPE_NAMES[addFormData.accountType]}`,
  })
  if (result.success) {
    ElMessage.success(t.value.accounts.addSuccess)
    addFormData.name = ''
    addFormData.currency = 'CNY'
    addFormData.accountType = 'cash'
    showAddModal.value = false
  } else {
    ElMessage.error(result.message)
  }
}

const cancelAddAccount = () => {
  showAddModal.value = false
  addFormData.name = ''
  addFormData.currency = 'CNY'
  addFormData.accountType = 'cash'
}

const handleDeleteAccount = (id: string) => {
  const result = deleteAccount(id)
  if (result.success) {
    ElMessage.success(t.value.accounts.deleteSuccess)
  } else {
    ElMessage.error(result.message)
  }
}

const handleOpenEdit = (account: Account) => {
  editName.value = account.name
  editBalance.value = account.balance.toString()
  showEditModal.value = true
}

const handleSaveEdit = () => {
  if (!editName.value.trim() || !showEditModal.value) return
  const account = accounts.value.find(a => a.id === showEditModal.value)
  if (!account) return
  const balance = parseFloat(editBalance.value)
  if (isNaN(balance)) {
    ElMessage.error(t.value.accounts.invalidBalance)
    return
  }
  updateAccount({ ...account, name: editName.value.trim(), balance })
  ElMessage.success(t.value.accounts.editSuccess)
  showEditModal.value = false
}

const editingAccount = computed(() => accounts.value.find(a => a.id === showEditModal.value))
</script>

<style scoped>
.accounts-page {
  padding: 24px;
}
.accounts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.accounts-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.empty-wrapper {
  text-align: center;
  padding: 48px 0;
  color: #999;
}
.accounts-collapse {
  background: #fff;
}
.collapse-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.secondary-text {
  color: #909399;
}
.account-name-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.negative-balance {
  color: #ff4d4f;
  font-weight: bold;
}
.edit-form {
  margin-top: 16px;
}
.form-group {
  margin-bottom: 16px;
}
.form-label {
  display: block;
  margin-bottom: 4px;
}
</style>
