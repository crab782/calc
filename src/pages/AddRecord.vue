<template>
  <div>
    <h4 class="page-title">{{ t.addRecord.title }}</h4>
    <el-card class="form-card">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <!-- Transaction Type Selector -->
        <el-form-item :label="t.addRecord.type">
          <div class="type-grid">
            <el-button
              v-for="typeOption in TRANSACTION_TYPES"
              :key="typeOption.value"
              :type="formData.type === typeOption.value ? 'primary' : 'default'"
              :style="typeButtonStyle(typeOption)"
              @click="selectType(typeOption.value)"
            >
              {{ typeOption.label }}
            </el-button>
          </div>
        </el-form-item>

        <!-- Currency -->
        <el-form-item :label="t.addRecord.currency" prop="currency">
          <el-select v-model="formData.currency" style="width: 100%">
            <el-option
              v-for="opt in CURRENCY_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <!-- Amount (simple) -->
        <el-form-item
          v-if="!needsPrincipalInterest"
          :label="t.addRecord.amount"
          prop="amount"
        >
          <el-input
            v-model="formData.amount"
            type="number"
            :prefix="currencySymbol"
            placeholder="0.00"
          />
        </el-form-item>

        <!-- Principal & Interest -->
        <template v-else>
          <el-form-item label="本金" prop="principal">
            <el-input
              v-model="formData.principal"
              type="number"
              :prefix="currencySymbol"
              placeholder="0.00"
            />
          </el-form-item>
          <el-form-item label="利息" prop="interest">
            <el-input
              v-model="formData.interest"
              type="number"
              :prefix="currencySymbol"
              placeholder="0.00"
            />
          </el-form-item>
        </template>

        <!-- Category -->
        <el-form-item :label="t.addRecord.category" prop="category">
          <el-select
            v-model="formData.category"
            :placeholder="t.addRecord.selectCategory"
            style="width: 100%"
          >
            <el-option
              v-for="cat in categories"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
        </el-form-item>

        <!-- Date -->
        <el-form-item :label="t.addRecord.date" prop="date">
          <el-date-picker
            v-model="formData.date"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <!-- Note -->
        <el-form-item :label="t.addRecord.note" prop="note">
          <el-input
            v-model="formData.note"
            type="textarea"
            :placeholder="t.addRecord.notePlaceholder"
            :rows="3"
          />
        </el-form-item>

        <!-- Submit -->
        <el-form-item>
          <el-button
            type="primary"
            @click="handleSubmit"
            :style="{ width: '100%', backgroundColor: saved ? '#22c55e' : undefined, borderColor: saved ? '#22c55e' : undefined }"
            :disabled="saved"
          >
            <el-icon v-if="saved"><Check /></el-icon>
            <el-icon v-else><Plus /></el-icon>
            {{ saved ? (t.addRecord.saved || '已保存') : (t.addRecord.addRecord || '添加记录') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus, Check } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useLanguage } from '../composables/useLanguage'
import { useRecords } from '../composables/useRecords'
import { generateEntries } from '../lib/record'
import type { ExpenseRecord } from '../types/record'

const { t } = useLanguage()
const { addRecord, incomeCategories, expenseCategories } = useRecords()
const formRef = ref<FormInstance>()
const saved = ref(false)

const TRANSACTION_TYPES = [
  { value: 'income', label: '收入', color: '#22c55e' },
  { value: 'expense', label: '支出', color: '#ef4444' },
  { value: 'investment', label: '投资', color: '#3b82f6' },
  { value: 'investment-mature', label: '投资到期', color: '#a855f7' },
  { value: 'loan-receive', label: '贷款到账', color: '#f97316' },
  { value: 'loan-repay', label: '还贷', color: '#eab308' },
] as const

const CURRENCY_OPTIONS = [
  { value: 'CNY', label: 'CNY (¥)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'JPY', label: 'JPY (¥)' },
]

const CURRENCY_SYMBOLS: Record<string, string> = { CNY: '¥', USD: '$', EUR: '€', GBP: '£', JPY: '¥' }

const formData = reactive({
  type: 'expense' as ExpenseRecord['type'],
  amount: undefined as number | undefined,
  principal: undefined as number | undefined,
  interest: undefined as number | undefined,
  category: '',
  note: '',
  date: new Date().toISOString().split('T')[0],
  currency: 'CNY',
})

const needsPrincipalInterest = computed(() =>
  formData.type === 'investment-mature' || formData.type === 'loan-repay'
)

const categories = computed(() => {
  if (formData.type === 'income' || formData.type === 'investment-mature') {
    return incomeCategories.value.map(c => c.name)
  }
  return expenseCategories.value.map(c => c.name)
})

const currencySymbol = computed(() => CURRENCY_SYMBOLS[formData.currency] || '¥')

const typeButtonStyle = (typeOption: typeof TRANSACTION_TYPES[number]) => {
  if (formData.type === typeOption.value) {
    return {
      borderColor: typeOption.color,
      backgroundColor: typeOption.color,
      color: '#fff',
    }
  }
  return {}
}

const selectType = (type: ExpenseRecord['type']) => {
  formData.type = type
  formData.category = ''
  formData.amount = undefined
  formData.principal = undefined
  formData.interest = undefined
}

const formRules = computed<FormRules>(() => {
  const rules: FormRules = {
    category: [{ required: true, message: t.value.addRecord.selectCategory, trigger: 'change' }],
    date: [{ required: true, message: '请选择日期', trigger: 'change' }],
    currency: [{ required: true, message: '请选择货币', trigger: 'change' }],
  }
  if (needsPrincipalInterest.value) {
    rules.principal = [
      { required: true, message: '请输入本金', trigger: 'blur' },
      { validator: (_rule: any, value: any, callback: any) => {
        if (!value || value <= 0) callback(new Error('请输入有效本金'))
        else callback()
      }, trigger: 'blur' }
    ]
    rules.interest = [
      { required: true, message: '请输入利息', trigger: 'blur' },
      { validator: (_rule: any, value: any, callback: any) => {
        if (!value || value <= 0) callback(new Error('请输入有效利息'))
        else callback()
      }, trigger: 'blur' }
    ]
  } else {
    rules.amount = [
      { required: true, message: '请输入金额', trigger: 'blur' },
      { validator: (_rule: any, value: any, callback: any) => {
        if (!value || value <= 0) callback(new Error('请输入有效金额'))
        else callback()
      }, trigger: 'blur' }
    ]
  }
  return rules
})

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  const totalAmount = needsPrincipalInterest.value
    ? Number(formData.principal) + Number(formData.interest)
    : Number(formData.amount)

  const entries = needsPrincipalInterest.value
    ? generateEntries(formData.type, totalAmount, Number(formData.principal), Number(formData.interest))
    : generateEntries(formData.type, totalAmount)

  addRecord({
    type: formData.type,
    amount: totalAmount,
    category: formData.category,
    note: formData.note || '',
    date: formData.date,
    currency: formData.currency,
    entries,
  })

  formRef.value.resetFields()
  formData.date = new Date().toISOString().split('T')[0]
  formData.currency = 'CNY'
  formData.type = 'expense'

  saved.value = true
  ElMessage.success(t.value.addRecord.saved || '保存成功')
  setTimeout(() => { saved.value = false }, 2000)
}
</script>

<style scoped>
.page-title {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
}
.form-card {
  max-width: 640px;
  margin: 0 auto;
}
.type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  width: 100%;
}
.type-grid .el-button {
  width: 100%;
}
</style>
