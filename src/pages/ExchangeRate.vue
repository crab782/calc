<template>
  <div>
    <div class="exchange-header">
      <el-space>
        <el-button text @click="router.push('/calc/settings')">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <h4 class="exchange-title">{{ t.exchangeRate.title }}</h4>
      </el-space>
    </div>

    <template v-if="!hasMultiCurrency">
      <el-alert :title="t.exchangeRate.noMultiCurrency" type="info" :closable="false" show-icon style="margin-bottom: 16px" />
    </template>
    <template v-else>
      <el-space direction="vertical" :size="16" class="full-width">
        <el-card>
          <template #header>
            <div class="card-header-between">
              <span>{{ t.exchangeRate.title }}</span>
              <el-space>
                <template v-if="!isEditing">
                  <el-button @click="handleFetchFromAPI" :loading="isFetching" :disabled="isFetching">
                    <el-icon><Refresh /></el-icon>
                    {{ t.exchangeRate.fetchFromAPI }}
                  </el-button>
                  <el-button type="primary" @click="handleStartEdit">
                    <el-icon><Edit /></el-icon>
                    {{ t.exchangeRate.manualEdit }}
                  </el-button>
                </template>
                <template v-else>
                  <el-button @click="handleCancelEdit">{{ t.exchangeRate.cancel }}</el-button>
                  <el-button type="primary" @click="handleSave">
                    <el-icon><Check /></el-icon>
                    {{ t.exchangeRate.save }}
                  </el-button>
                </template>
              </el-space>
            </div>
          </template>
          <el-space direction="vertical" :size="8">
            <div>
              <span class="secondary-text">{{ t.exchangeRate.baseCurrency }}: </span>
              <strong>{{ defaultCurrency }}</strong>
            </div>
            <div>
              <span class="secondary-text">{{ t.exchangeRate.lastUpdate }}: </span>
              <span>{{ formatLastUpdate(exchangeRates.lastUpdatedAt) }}</span>
            </div>
            <div>
              <span class="secondary-text">{{ t.exchangeRate.source }}: </span>
              <el-tag :color="sourceTagColor(exchangeRates.source)">{{ getSourceText(exchangeRates.source) }}</el-tag>
              <span v-if="exchangeRates.source === 'api' && exchangeRates.apiSource" class="secondary-text" style="margin-left: 8px">
                {{ exchangeRates.apiSource }}
              </span>
            </div>
            <div v-if="isEditing">
              <span class="secondary-text">{{ t.exchangeRate.availableApis }}: </span>
              <el-space wrap>
                <el-tag v-for="api in EXCHANGE_RATE_APIS" :key="api.name" type="info">{{ api.name }}</el-tag>
              </el-space>
            </div>
          </el-space>
        </el-card>

        <el-card>
          <el-table :data="tableData" stripe size="small">
            <el-table-column prop="currency" :label="t.exchangeRate.currency" width="120">
              <template #default="{ row }">
                <strong>{{ row.currency }}</strong>
              </template>
            </el-table-column>
            <el-table-column :label="t.exchangeRate.rate" width="200">
              <template #default="{ row }">
                <template v-if="isEditing">
                  <el-input-number
                    :model-value="parseFloat(editingRates[row.currency as string] ?? '')"
                    @update:model-value="val => editingRates[row.currency as string] = String(val ?? '')"
                    :placeholder="`1 ${defaultCurrency} = ? ${row.currency}`"
                    :step="0.0001"
                    :precision="4"
                    :min="0"
                    controls-position="right"
                    style="width: 100%"
                  />
                </template>
                <template v-else>
                  <span>1 {{ defaultCurrency }} = {{ row.rate }} {{ row.currency }}</span>
                </template>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-space>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Refresh, Edit, Check } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useLanguage } from '../composables/useLanguage'
import { useRecords } from '../composables/useRecords'
import { DEFAULT_EXCHANGE_RATES, EXCHANGE_RATE_APIS } from '../types/record'

const router = useRouter()
const { t } = useLanguage()
const { exchangeRates, customCurrencies, updateExchangeRate, fetchExchangeRatesFromAPI, canFetchRatesFromAPI, accounts } = useRecords()

const isEditing = ref(false)
const editingRates = ref<Record<string, string>>({})
const isFetching = ref(false)

const defaultCurrency = computed(() => {
  const defaultAccount = accounts.value.find(a => a.isDefault)
  return defaultAccount?.currency || 'CNY'
})

const enabledCurrencies = computed(() => {
  const currencies = new Set<string>()
  accounts.value.forEach(a => {
    if (a.currency !== defaultCurrency.value && a.visible) {
      currencies.add(a.currency)
    }
  })
  customCurrencies.value.forEach(c => currencies.add(c.code))
  return Array.from(currencies).sort()
})

const tableData = computed(() => {
  return enabledCurrencies.value.map(currency => ({
    key: currency,
    currency,
    rate: exchangeRates.value.rates[currency] ?? DEFAULT_EXCHANGE_RATES[currency] ?? 0,
    editRate: editingRates.value[currency] ?? '',
  }))
})

const getSourceText = (source: string) => {
  switch (source) {
    case 'manual':
      return t.value.exchangeRate.sourceManual
    case 'api':
      return t.value.exchangeRate.sourceApi
    default:
      return t.value.exchangeRate.sourceDefault
  }
}

const sourceTagColor = (source: string) => {
  switch (source) {
    case 'api': return 'success'
    case 'manual': return ''
    default: return 'info'
  }
}

const formatLastUpdate = (timestamp: number) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('zh-CN')
}

const hasMultiCurrency = computed(() => enabledCurrencies.value.length > 0)

const handleStartEdit = () => {
  const initial: Record<string, string> = {}
  enabledCurrencies.value.forEach(currency => {
    initial[currency] = String(exchangeRates.value.rates[currency] ?? DEFAULT_EXCHANGE_RATES[currency] ?? '')
  })
  editingRates.value = initial
  isEditing.value = true
}

const handleSave = () => {
  const rates: Record<string, number> = {}
  for (const [currency, value] of Object.entries(editingRates.value)) {
    const num = parseFloat(value)
    if (isNaN(num) || num <= 0) {
      ElMessage.error(t.value.exchangeRate.invalidRate)
      return
    }
    rates[currency] = num
  }
  updateExchangeRate(rates, defaultCurrency.value)
  ElMessage.success(t.value.exchangeRate.saveSuccess)
  isEditing.value = false
  editingRates.value = {}
}

const handleCancelEdit = () => {
  isEditing.value = false
  editingRates.value = {}
}

const handleFetchFromAPI = async () => {
  const canFetch = canFetchRatesFromAPI()
  if (!canFetch.allowed) {
    const hours = Math.ceil(canFetch.remainingHours)
    ElMessage.warning(t.value.exchangeRate.hoursLeft.replace('{hours}', String(hours)))
    return
  }

  isFetching.value = true
  try {
    const result = await fetchExchangeRatesFromAPI(defaultCurrency.value)
    if (result.success) {
      ElMessage.success(result.message || t.value.exchangeRate.fetchSuccess)
    } else {
      ElMessage.error(result.message || t.value.exchangeRate.fetchError)
    }
  } catch {
    ElMessage.error(t.value.exchangeRate.fetchError)
  } finally {
    isFetching.value = false
  }
}
</script>

<style scoped>
.exchange-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.exchange-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.full-width {
  width: 100%;
}
.card-header-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.secondary-text {
  color: #909399;
}
</style>
