<template>
  <div>
    <div class="settings-header">
      <h4 class="settings-title">{{ t.settings.title }}</h4>
      <el-button size="small" @click="toggleLanguage">
        <el-icon><MapLocation /></el-icon>
        {{ language === 'zh' ? 'EN' : '中文' }}
      </el-button>
    </div>

    <input ref="fileInputRef" type="file" accept=".json" @change="handleFileSelect" class="hidden-input" />

    <el-space direction="vertical" :size="24" class="settings-space">
      <!-- Appearance -->
      <el-card :title="t.settings.appearance">
        <div class="theme-grid">
          <el-button
            v-for="option in themeOptions"
            :key="option.key"
            :type="theme === option.key ? 'primary' : 'default'"
            @click="setTheme(option.key)"
            class="theme-btn"
          >
            <el-icon :size="24">
              <component :is="option.icon" />
            </el-icon>
            <span>{{ option.label }}</span>
          </el-button>
        </div>
      </el-card>

      <!-- Category Management -->
      <el-card :title="t.settings.categoryManagement">
        <el-space direction="vertical" :size="24" class="category-section">
          <!-- Income Categories -->
          <div>
            <strong class="section-label">{{ t.settings.incomeCategories }}</strong>
            <div class="tag-group">
              <el-tag
                v-for="category in incomeCategories"
                :key="category.id"
                type="success"
                closable
                @close="showDeleteConfirm = category.id"
              >
                {{ category.name }}
              </el-tag>
              <el-button size="small" type="primary" plain @click="showAddCategory = 'income'">
                <el-icon><Plus /></el-icon>
                {{ t.settings.addIncomeCategory }}
              </el-button>
            </div>
          </div>

          <!-- Expense Categories -->
          <div>
            <strong class="section-label">{{ t.settings.expenseCategories }}</strong>
            <div class="tag-group">
              <el-tag
                v-for="category in expenseCategories"
                :key="category.id"
                type="danger"
                closable
                @close="showDeleteConfirm = category.id"
              >
                {{ category.name }}
              </el-tag>
              <el-button size="small" type="primary" plain @click="showAddCategory = 'expense'">
                <el-icon><Plus /></el-icon>
                {{ t.settings.addExpenseCategory }}
              </el-button>
            </div>
          </div>
        </el-space>
      </el-card>

      <!-- Currency Management -->
      <el-card :title="t.settings.currencyManagement">
        <template #header>
          <div class="card-header-between">
            <span>{{ t.settings.currencyManagement }}</span>
            <el-button @click="showCurrencyModal = true">
              <el-icon><Coin /></el-icon>
              {{ t.settings.manageCurrencies }}
            </el-button>
          </div>
        </template>
        <span class="secondary-text">
          {{ t.settings.foreignCurrencies }}: {{ enabledForeignCurrencies }}
          <template v-if="customCurrencies.length > 0">
            , {{ t.settings.customCurrencies }}: {{ customCurrencies.map(c => c.code).join(', ') }}
          </template>
        </span>
      </el-card>

      <!-- Data Management -->
      <el-card :title="t.settings.dataManagement">
        <el-space direction="vertical" :size="16" class="data-section">
          <div class="record-count-row">
            <span class="secondary-text">{{ t.settings.currentRecords }}</span>
            <strong class="record-count">{{ count }}</strong>
          </div>
          <el-space class="full-width">
            <el-button type="primary" @click="handleExport" class="half-btn">
              <el-icon><Download /></el-icon>
              {{ t.settings.exportData }}
            </el-button>
            <el-button type="primary" @click="handleImportClick" class="half-btn">
              <el-icon><Upload /></el-icon>
              {{ t.settings.importData }}
            </el-button>
          </el-space>
          <el-divider style="margin: 8px 0" />
          <el-popconfirm
            :title="t.settings.clearConfirm"
            :description="t.settings.clearMessage"
            @confirm="handleClearData"
            confirm-button-type="danger"
          >
            <template #reference>
              <el-button type="danger" size="small">
                <el-icon><Delete /></el-icon>
                {{ t.settings.clearData }}
              </el-button>
            </template>
          </el-popconfirm>
        </el-space>
      </el-card>

      <!-- Info Alert -->
      <el-alert :title="t.settings.importExportInfo" type="info" :closable="false" show-icon>
        <ul class="info-list">
          <li>{{ t.settings.info1 }}</li>
          <li>{{ t.settings.info2 }}</li>
          <li>{{ t.settings.info3 }}</li>
          <li>{{ t.settings.info4 }}</li>
        </ul>
      </el-alert>
    </el-space>

    <!-- Currency Modal -->
    <el-dialog
      v-model="showCurrencyModal"
      :title="t.settings.currencyManagement"
      width="500px"
    >
      <div class="currency-modal-content">
        <strong class="section-label">{{ t.settings.foreignCurrencies }}</strong>
        <el-space direction="vertical" :size="8" class="currency-checkbox-group">
          <el-checkbox
            v-for="fc in FOREIGN_CURRENCIES"
            :key="fc.value"
            v-model="currencyChecks[fc.value]"
            @change="handleCurrencyToggle(fc.value, $event)"
          >
            {{ fc.label }}
          </el-checkbox>
        </el-space>

        <strong class="section-label">{{ t.settings.customCurrencies }}</strong>
        <div v-if="customCurrencies.length > 0" class="tag-group">
          <el-tag
            v-for="c in customCurrencies"
            :key="c.code"
            type="primary"
            closable
            @close="handleDeleteCustomCurrency(c.code)"
          >
            {{ c.name }} ({{ c.code }})
          </el-tag>
        </div>
        <span v-else class="secondary-text">{{ t.settings.noCustomCurrencies }}</span>

        <template v-if="!showAddCustomCurrency">
          <el-button type="primary" plain @click="showAddCustomCurrency = true" class="full-width-btn">
            <el-icon><CirclePlus /></el-icon>
            {{ t.settings.addCustomCurrency }}
          </el-button>
        </template>
        <template v-else>
          <el-space class="full-width">
            <el-input
              v-model="newCurrencyCode"
              :placeholder="t.settings.currencyCode"
              :maxlength="5"
              style="width: 100px"
              @input="newCurrencyCode = (newCurrencyCode as string).toUpperCase()"
            />
            <el-input
              v-model="newCurrencyName"
              :placeholder="t.settings.currencyName"
              class="flex-1"
            />
            <el-button type="primary" @click="handleAddCustomCurrency">
              {{ t.settings.addCustomCurrency }}
            </el-button>
            <el-button @click="cancelAddCustomCurrency">
              <el-icon><Close /></el-icon>
              {{ t.settings.cancel }}
            </el-button>
          </el-space>
        </template>
      </div>
    </el-dialog>

    <!-- Add Category Modal -->
    <el-dialog
      v-model="showAddCategoryModal"
      :title="showAddCategory === 'income' ? t.settings.addIncomeCategory : t.settings.addExpenseCategory"
      width="400px"
    >
      <el-input
        v-model="newCategoryName"
        :placeholder="t.settings.categoryNamePlaceholder"
        autofocus
        @keyup.enter="handleAddCategory"
        style="margin-top: 16px"
      />
      <template #footer>
        <el-button @click="cancelAddCategory">{{ t.settings.cancel }}</el-button>
        <el-button type="primary" @click="handleAddCategory">
          {{ showAddCategory === 'income' ? t.settings.addIncomeCategory : t.settings.addExpenseCategory }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Delete Category Confirmation Modal -->
    <el-dialog
      v-model="showDeleteCategoryModal"
      :title="t.settings.deleteCategory"
      width="400px"
    >
      <p>{{ t.settings.deleteCategoryConfirm }}</p>
      <template #footer>
        <el-button @click="showDeleteCategoryModal = false">{{ t.settings.cancel }}</el-button>
        <el-button type="danger" @click="handleDeleteCategory">{{ t.settings.confirmClear }}</el-button>
      </template>
    </el-dialog>

    <!-- Clear Data Confirmation Modal -->
    <el-dialog
      v-model="showConfirmClear"
      :title="t.settings.clearConfirm"
      width="400px"
    >
      <p>{{ t.settings.clearMessage }}</p>
      <template #footer>
        <el-button @click="showConfirmClear = false">{{ t.settings.cancel }}</el-button>
        <el-button type="danger" @click="handleClearData">{{ t.settings.confirmClear }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Download, Upload, Delete, Plus, Sunny, Moon, Monitor, MapLocation, Coin, Close, CirclePlus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { Component } from 'vue'
import { useLanguage } from '../composables/useLanguage'
import { useTheme } from '../composables/useTheme'
import { useRecords } from '../composables/useRecords'
import { recordService } from '../lib/record'

const { t, language, toggleLanguage } = useLanguage()
const { theme, setTheme } = useTheme()
const { count, refresh, incomeCategories, expenseCategories, addCategory, deleteCategory, accounts, enableCurrency, disableCurrency, customCurrencies, addCustomCurrency, deleteCustomCurrency } = useRecords()

const showConfirmClear = ref(false)
const showAddCategory = ref<'income' | 'expense' | null>(null)
const showAddCategoryModal = computed(() => !!showAddCategory.value)
const newCategoryName = ref('')
const showDeleteConfirm = ref<string | null>(null)
const showDeleteCategoryModal = computed({
  get: () => !!showDeleteConfirm.value,
  set: (val: boolean) => { if (!val) showDeleteConfirm.value = null }
})
const fileInputRef = ref<HTMLInputElement | null>(null)

const showCurrencyModal = ref(false)
const showAddCustomCurrency = ref(false)
const newCurrencyCode = ref('')
const newCurrencyName = ref('')

const FOREIGN_CURRENCIES = [
  { value: 'USD', label: '美元 (USD)' },
  { value: 'EUR', label: '欧元 (EUR)' },
  { value: 'GBP', label: '英镑 (GBP)' },
  { value: 'JPY', label: '日元 (JPY)' },
]

const availableCurrencies = computed(() => Array.from(new Set(accounts.value.map(a => a.currency))))

const isCurrencyEnabled = (currency: string): boolean =>
  accounts.value.some(a => a.currency === currency && a.visible === true)

const enabledForeignCurrencies = computed(() =>
  FOREIGN_CURRENCIES.filter(fc => isCurrencyEnabled(fc.value)).map(fc => fc.value).join(', ') || '无'
)

const currencyChecks = computed<Record<string, boolean>>(() => {
  const checks: Record<string, boolean> = {}
  FOREIGN_CURRENCIES.forEach(fc => {
    checks[fc.value] = isCurrencyEnabled(fc.value)
  })
  return checks
})

const handleCurrencyToggle = (currency: string, checked: string | boolean | undefined) => {
  const enabled = typeof checked === 'boolean' ? checked : true
  if (enabled) {
    enableCurrency(currency)
    ElMessage.success(`${currency} 币种已启用`)
  } else {
    const result = disableCurrency(currency)
    if (result.success) {
      ElMessage.success(`${currency} 币种已禁用`)
    } else {
      ElMessage.error(result.message)
    }
  }
}

const handleAddCustomCurrency = () => {
  const code = newCurrencyCode.value.trim().toUpperCase()
  const name = newCurrencyName.value.trim()
  if (!code || !name) {
    ElMessage.error('请输入货币代码和名称')
    return
  }
  if (availableCurrencies.value.includes(code)) {
    ElMessage.error('该货币代码已存在')
    return
  }
  addCustomCurrency({ code, name })
  ElMessage.success(`自定义货币 ${name} (${code}) 已添加`)
  newCurrencyCode.value = ''
  newCurrencyName.value = ''
  showAddCustomCurrency.value = false
}

const handleDeleteCustomCurrency = (code: string) => {
  deleteCustomCurrency(code)
  ElMessage.success('自定义货币已删除')
}

const cancelAddCustomCurrency = () => {
  showAddCustomCurrency.value = false
  newCurrencyCode.value = ''
  newCurrencyName.value = ''
}

const handleExport = () => {
  const jsonData = recordService.exportData()
  const blob = new Blob([jsonData], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'account-book.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success(t.value.settings.exportSuccess)
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  if (count.value > 0) {
    const confirmText = t.value.settings.importConfirm.replace('{count}', String(count.value))
    if (!confirm(confirmText)) {
      target.value = ''
      return
    }
  }
  const reader = new FileReader()
  reader.onload = (event) => {
    const result = event.target?.result as string
    const importResult = recordService.importData(result)
    if (importResult.success) {
      ElMessage.success(t.value.settings.importSuccess)
      refresh()
    } else {
      ElMessage.error(t.value.settings.importError)
    }
    target.value = ''
  }
  reader.readAsText(file)
}

const handleImportClick = () => {
  fileInputRef.value?.click()
}

const handleClearData = () => {
  recordService.deleteAllRecords()
  refresh()
  ElMessage.success(t.value.settings.clearSuccess)
  showConfirmClear.value = false
}

const handleAddCategory = () => {
  if (!newCategoryName.value.trim() || !showAddCategory.value) return
  addCategory({ name: newCategoryName.value.trim(), type: showAddCategory.value, icon: 'tag' })
  ElMessage.success(t.value.settings.addCategorySuccess)
  newCategoryName.value = ''
  showAddCategory.value = null
}

const cancelAddCategory = () => {
  showAddCategory.value = null
  newCategoryName.value = ''
}

const handleDeleteCategory = () => {
  if (showDeleteConfirm.value) {
    const result = deleteCategory(showDeleteConfirm.value)
    if (result.success) {
      ElMessage.success(t.value.settings.deleteCategorySuccess)
    } else {
      ElMessage.error(t.value.settings.categoryInUse)
    }
    showDeleteConfirm.value = null
  }
}

interface ThemeOption {
  key: 'light' | 'dark' | 'system'
  icon: Component
  label: string
}

const themeOptions: ThemeOption[] = [
  { key: 'light', icon: Sunny, label: t.value.settings.lightMode },
  { key: 'dark', icon: Moon, label: t.value.settings.darkMode },
  { key: 'system', icon: Monitor, label: t.value.settings.systemMode },
]
</script>

<style scoped>
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.settings-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.hidden-input {
  display: none;
}
.settings-space {
  width: 100%;
}
.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}
.theme-btn {
  height: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.category-section {
  width: 100%;
}
.section-label {
  display: block;
  margin-bottom: 12px;
}
.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.card-header-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.secondary-text {
  color: #909399;
}
.data-section {
  width: 100%;
}
.record-count-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}
.record-count {
  font-size: 20px;
}
.full-width {
  width: 100%;
}
.half-btn {
  flex: 1;
}
.info-list {
  margin: 0;
  padding-left: 16px;
}
.currency-modal-content {
  margin-top: 16px;
}
.currency-checkbox-group {
  width: 100%;
  margin-bottom: 24px;
}
.flex-1 {
  flex: 1;
}
.full-width-btn {
  width: 100%;
}
</style>
