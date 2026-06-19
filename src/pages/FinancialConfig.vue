<template>
  <div class="financial-config-page">
    <h4 class="page-title">财务配置</h4>
    <el-row :gutter="16" style="margin-bottom: 24px">
      <el-col :xs="24" :sm="8">
        <el-card class="summary-card">
          <div class="summary-header">
            <el-space align="center">
              <el-icon :size="24" color="#52c41a"><Top /></el-icon>
              <div>
                <span>预期月收入</span>
                <div class="summary-sub">按币种统计</div>
              </div>
            </el-space>
          </div>
          <template v-if="Object.keys(expectedMonthlyIncome).length === 0">
            <span class="no-data">暂无数据</span>
          </template>
          <template v-else>
            <el-space direction="vertical" :size="8" style="width: 100%">
              <div v-for="(amount, currency) in expectedMonthlyIncome" :key="currency" class="summary-row">
                <span class="currency-label">{{ currency }}</span>
                <span class="amount income-color">{{ formatAmount(amount, currency) }}</span>
              </div>
            </el-space>
          </template>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card class="summary-card">
          <div class="summary-header">
            <el-space align="center">
              <el-icon :size="24" color="#ff4d4f"><Bottom /></el-icon>
              <div>
                <span>预期月支出</span>
                <div class="summary-sub">按币种统计</div>
              </div>
            </el-space>
          </div>
          <template v-if="Object.keys(expectedMonthlyExpense).length === 0">
            <span class="no-data">暂无数据</span>
          </template>
          <template v-else>
            <el-space direction="vertical" :size="8" style="width: 100%">
              <div v-for="(amount, currency) in expectedMonthlyExpense" :key="currency" class="summary-row">
                <span class="currency-label">{{ currency }}</span>
                <span class="amount expense-color">{{ formatAmount(amount, currency) }}</span>
              </div>
            </el-space>
          </template>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card class="summary-card">
          <div class="summary-header">
            <el-space align="center">
              <el-icon :size="24" color="#1677ff"><Wallet /></el-icon>
              <div>
                <span>预期月结余</span>
                <div class="summary-sub">按币种统计</div>
              </div>
            </el-space>
          </div>
          <template v-if="Object.keys(expectedMonthlyBalance).length === 0">
            <span class="no-data">暂无数据</span>
          </template>
          <template v-else>
            <el-space direction="vertical" :size="8" style="width: 100%">
              <div v-for="(amount, currency) in expectedMonthlyBalance" :key="currency" class="summary-row">
                <span class="currency-label">{{ currency }}</span>
                <span class="amount balance-color">{{ formatAmount(amount, currency) }}</span>
              </div>
            </el-space>
          </template>
        </el-card>
      </el-col>
    </el-row>

    <el-collapse v-model="activeCollapseKeys" class="config-collapse" style="background: #fff">
      <el-collapse-item name="income">
        <template #title>
          <span class="collapse-title">
            <el-icon :size="16" color="#52c41a"><Top /></el-icon>
            <strong style="margin-left: 8px">收入配置</strong>
            <span class="secondary-text" style="margin-left: 8px">({{ incomeSources.length }})</span>
          </span>
        </template>
        <template #extra>
          <el-button type="primary" size="small" @click.stop="openAddModal('income')">
            <el-icon><Plus /></el-icon>
            添加
          </el-button>
        </template>
        <template v-if="incomeSources.length === 0">
          <el-empty description="暂无收入配置，点击上方按钮添加" />
        </template>
        <template v-else>
          <el-table :data="incomeSources" row-key="id" size="small">
            <el-table-column label="名称" prop="name" width="150">
              <template #default="{ row }"><strong>{{ row.name }}</strong></template>
            </el-table-column>
            <el-table-column label="币种" prop="currency" width="80" />
            <el-table-column label="金额" prop="amount" width="120">
              <template #default="{ row }"><strong>{{ formatAmount(row.amount, row.currency) }}</strong></template>
            </el-table-column>
            <el-table-column label="周期" width="120">
              <template #default="{ row }">
                <el-tag>{{ formatPeriod(row.period, row) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="月度金额" width="120">
              <template #default="{ row }">
                <template v-if="calculateMonthlyAmount(row.amount, row.period) > 0">
                  {{ formatAmount(calculateMonthlyAmount(row.amount, row.period), row.currency) }}
                </template>
                <span v-else class="secondary-text">—</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-space size="small">
                  <el-button type="primary" text size="small" @click="openEditModal(row)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-popconfirm
                    title="确认删除"
                    description="确定要删除这条记录吗？此操作无法撤销。"
                    @confirm="handleDelete(row.id)"
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
        </template>
      </el-collapse-item>

      <el-collapse-item name="expense">
        <template #title>
          <span class="collapse-title">
            <el-icon :size="16" color="#ff4d4f"><Bottom /></el-icon>
            <strong style="margin-left: 8px">支出配置</strong>
            <span class="secondary-text" style="margin-left: 8px">({{ expenseSources.length }})</span>
          </span>
        </template>
        <template #extra>
          <el-button type="primary" size="small" @click.stop="openAddModal('expense')">
            <el-icon><Plus /></el-icon>
            添加
          </el-button>
        </template>
        <template v-if="expenseSources.length === 0">
          <el-empty description="暂无支出配置，点击上方按钮添加" />
        </template>
        <template v-else>
          <el-table :data="expenseSources" row-key="id" size="small">
            <el-table-column label="名称" prop="name" width="150">
              <template #default="{ row }"><strong>{{ row.name }}</strong></template>
            </el-table-column>
            <el-table-column label="币种" prop="currency" width="80" />
            <el-table-column label="金额" prop="amount" width="120">
              <template #default="{ row }"><strong>{{ formatAmount(row.amount, row.currency) }}</strong></template>
            </el-table-column>
            <el-table-column label="周期" width="120">
              <template #default="{ row }">
                <el-tag>{{ formatPeriod(row.period, row) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="月度金额" width="120">
              <template #default="{ row }">
                <template v-if="calculateMonthlyAmount(row.amount, row.period) > 0">
                  {{ formatAmount(calculateMonthlyAmount(row.amount, row.period), row.currency) }}
                </template>
                <span v-else class="secondary-text">—</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-space size="small">
                  <el-button type="primary" text size="small" @click="openEditModal(row)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-popconfirm
                    title="确认删除"
                    description="确定要删除这条记录吗？此操作无法撤销。"
                    @confirm="handleDelete(row.id)"
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
        </template>
      </el-collapse-item>

      <el-collapse-item name="investment">
        <template #title>
          <span class="collapse-title">
            <el-icon :size="16" color="#722ed1"><Money /></el-icon>
            <strong style="margin-left: 8px">投资配置</strong>
            <span class="secondary-text" style="margin-left: 8px">({{ investmentSources.length }})</span>
          </span>
        </template>
        <template #extra>
          <el-button type="primary" size="small" @click.stop="openAddModal('investment')">
            <el-icon><Plus /></el-icon>
            添加
          </el-button>
        </template>
        <template v-if="investmentSources.length === 0">
          <el-empty description="暂无投资配置，点击上方按钮添加" />
        </template>
        <template v-else>
          <el-table :data="investmentSources" row-key="id" size="small">
            <el-table-column label="名称" prop="name" width="150">
              <template #default="{ row }"><strong>{{ row.name }}</strong></template>
            </el-table-column>
            <el-table-column label="币种" prop="currency" width="80" />
            <el-table-column label="金额" prop="amount" width="120">
              <template #default="{ row }"><strong>{{ formatAmount(row.amount, row.currency) }}</strong></template>
            </el-table-column>
            <el-table-column label="周期" width="120">
              <template #default="{ row }">
                <el-tag>{{ formatPeriod(row.period, row) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="月度金额" width="120">
              <template #default="{ row }">
                <template v-if="calculateMonthlyAmount(row.amount, row.period) > 0">
                  {{ formatAmount(calculateMonthlyAmount(row.amount, row.period), row.currency) }}
                </template>
                <span v-else class="secondary-text">—</span>
              </template>
            </el-table-column>
            <el-table-column label="预期收益率" width="100">
              <template #default="{ row }">{{ row.expectedReturn !== undefined ? `${row.expectedReturn}%` : '—' }}</template>
            </el-table-column>
            <el-table-column label="投资类型" width="100">
              <template #default="{ row }">{{ row.investmentType ? INVESTMENT_TYPE_OPTIONS.find(i => i.value === row.investmentType)?.label : '—' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-space size="small">
                  <el-button type="primary" text size="small" @click="openEditModal(row)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-popconfirm
                    title="确认删除"
                    description="确定要删除这条记录吗？此操作无法撤销。"
                    @confirm="handleDelete(row.id)"
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
        </template>
      </el-collapse-item>

      <el-collapse-item name="loan">
        <template #title>
          <span class="collapse-title">
            <el-icon :size="16" color="#fa8c16"><CreditCard /></el-icon>
            <strong style="margin-left: 8px">贷款配置</strong>
            <span class="secondary-text" style="margin-left: 8px">({{ loanSources.length }})</span>
          </span>
        </template>
        <template #extra>
          <el-button type="primary" size="small" @click.stop="openAddModal('loan')">
            <el-icon><Plus /></el-icon>
            添加
          </el-button>
        </template>
        <template v-if="loanSources.length === 0">
          <el-empty description="暂无贷款配置，点击上方按钮添加" />
        </template>
        <template v-else>
          <el-table :data="loanSources" row-key="id" size="small">
            <el-table-column label="名称" prop="name" width="150">
              <template #default="{ row }"><strong>{{ row.name }}</strong></template>
            </el-table-column>
            <el-table-column label="币种" prop="currency" width="80" />
            <el-table-column label="金额" prop="amount" width="120">
              <template #default="{ row }"><strong>{{ formatAmount(row.amount, row.currency) }}</strong></template>
            </el-table-column>
            <el-table-column label="周期" width="120">
              <template #default="{ row }">
                <el-tag>{{ formatPeriod(row.period, row) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="月度金额" width="120">
              <template #default="{ row }">
                <template v-if="calculateMonthlyAmount(row.amount, row.period) > 0">
                  {{ formatAmount(calculateMonthlyAmount(row.amount, row.period), row.currency) }}
                </template>
                <span v-else class="secondary-text">—</span>
              </template>
            </el-table-column>
            <el-table-column label="本金" width="120">
              <template #default="{ row }">{{ row.principal !== undefined ? formatAmount(row.principal, row.currency) : '—' }}</template>
            </el-table-column>
            <el-table-column label="利率" width="80">
              <template #default="{ row }">{{ row.interestRate !== undefined ? `${row.interestRate}%` : '—' }}</template>
            </el-table-column>
            <el-table-column label="还款方式" width="100">
              <template #default="{ row }">{{ row.interestType ? INTEREST_TYPE_LABELS[row.interestType] : '—' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-space size="small">
                  <el-button type="primary" text size="small" @click="openEditModal(row)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-popconfirm
                    title="确认删除"
                    description="确定要删除这条记录吗？此操作无法撤销。"
                    @confirm="handleDelete(row.id)"
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
        </template>
      </el-collapse-item>
    </el-collapse>

    <!-- Add Modal -->
    <el-dialog
      v-model="showAddModal"
      :title="`添加${typeLabel(currentType)}`"
      width="450px"
    >
      <el-form ref="formRef" :model="formData" label-position="top" style="margin-top: 16px">
        <el-form-item label="名称" prop="name" :rules="[{ required: true, message: '请输入名称', trigger: 'blur' }]">
          <el-input v-model="formData.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="币种" prop="currency" :rules="[{ required: true, message: '请选择币种', trigger: 'change' }]">
          <el-select v-model="formData.currency" style="width: 100%">
            <el-option v-for="opt in CURRENCY_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额" prop="amount" :rules="[{ required: true, type: 'number', min: 0, message: '请输入有效金额', trigger: 'blur' }]">
          <el-input v-model.number="formData.amount" type="number" placeholder="请输入金额" min="0" step="0.01" />
        </el-form-item>
        <el-form-item label="周期" prop="period" :rules="[{ required: true, message: '请选择周期', trigger: 'change' }]">
          <el-select v-model="formData.period" style="width: 100%">
            <el-option v-for="opt in PERIOD_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="formData.period === 'monthly'" label="每月几号" prop="dayOfMonth" :rules="[{ required: true, message: '请选择日期', trigger: 'change' }]">
          <el-select v-model="formData.dayOfMonth" placeholder="选择每月几号" style="width: 100%">
            <el-option v-for="opt in DAY_OF_MONTH_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="formData.period === 'weekly'" label="每周几" prop="dayOfWeek" :rules="[{ required: true, message: '请选择星期', trigger: 'change' }]">
          <el-select v-model="formData.dayOfWeek" placeholder="选择每周几" style="width: 100%">
            <el-option v-for="opt in DAY_OF_WEEK_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <template v-if="currentType === 'investment'">
          <el-form-item label="投资类型" prop="investmentType">
            <el-select v-model="formData.investmentType" style="width: 100%">
              <el-option v-for="opt in INVESTMENT_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="预期收益率 (%)" prop="expectedReturn">
            <el-input v-model.number="formData.expectedReturn" type="number" placeholder="请输入预期收益率" min="0" step="0.01" />
          </el-form-item>
        </template>
        <template v-if="currentType === 'loan'">
          <el-form-item label="本金" prop="principal" :rules="[{ required: true, type: 'number', min: 0, message: '请输入有效的本金', trigger: 'blur' }]">
            <el-input v-model.number="formData.principal" type="number" placeholder="请输入本金" min="0" step="0.01" />
          </el-form-item>
          <el-form-item label="年利率 (%)" prop="interestRate" :rules="[{ required: true, type: 'number', min: 0, message: '请输入有效的利率', trigger: 'blur' }]">
            <el-input v-model.number="formData.interestRate" type="number" placeholder="请输入年利率" min="0" step="0.01" />
          </el-form-item>
          <el-form-item label="还款方式" prop="interestType">
            <el-select v-model="formData.interestType" style="width: 100%">
              <el-option v-for="opt in INTEREST_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="showAddModal = false; resetForm()">取消</el-button>
        <el-button type="primary" @click="handleAdd">添加</el-button>
      </template>
    </el-dialog>

    <!-- Edit Modal -->
    <el-dialog
      v-model="showEditModal"
      :title="`编辑${typeLabel(currentType)}`"
      width="450px"
    >
      <el-form ref="editFormRef" :model="editFormData" label-position="top" style="margin-top: 16px">
        <el-form-item label="名称" prop="name" :rules="[{ required: true, message: '请输入名称', trigger: 'blur' }]">
          <el-input v-model="editFormData.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="币种" prop="currency" :rules="[{ required: true, message: '请选择币种', trigger: 'change' }]">
          <el-select v-model="editFormData.currency" style="width: 100%">
            <el-option v-for="opt in CURRENCY_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额" prop="amount" :rules="[{ required: true, type: 'number', min: 0, message: '请输入有效金额', trigger: 'blur' }]">
          <el-input v-model.number="editFormData.amount" type="number" placeholder="请输入金额" min="0" step="0.01" />
        </el-form-item>
        <el-form-item label="周期" prop="period" :rules="[{ required: true, message: '请选择周期', trigger: 'change' }]">
          <el-select v-model="editFormData.period" style="width: 100%">
            <el-option v-for="opt in PERIOD_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="editFormData.period === 'monthly'" label="每月几号" prop="dayOfMonth" :rules="[{ required: true, message: '请选择日期', trigger: 'change' }]">
          <el-select v-model="editFormData.dayOfMonth" placeholder="选择每月几号" style="width: 100%">
            <el-option v-for="opt in DAY_OF_MONTH_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="editFormData.period === 'weekly'" label="每周几" prop="dayOfWeek" :rules="[{ required: true, message: '请选择星期', trigger: 'change' }]">
          <el-select v-model="editFormData.dayOfWeek" placeholder="选择每周几" style="width: 100%">
            <el-option v-for="opt in DAY_OF_WEEK_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <template v-if="currentType === 'investment'">
          <el-form-item label="投资类型" prop="investmentType">
            <el-select v-model="editFormData.investmentType" style="width: 100%">
              <el-option v-for="opt in INVESTMENT_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="预期收益率 (%)" prop="expectedReturn">
            <el-input v-model.number="editFormData.expectedReturn" type="number" placeholder="请输入预期收益率" min="0" step="0.01" />
          </el-form-item>
        </template>
        <template v-if="currentType === 'loan'">
          <el-form-item label="本金" prop="principal" :rules="[{ required: true, type: 'number', min: 0, message: '请输入有效的本金', trigger: 'blur' }]">
            <el-input v-model.number="editFormData.principal" type="number" placeholder="请输入本金" min="0" step="0.01" />
          </el-form-item>
          <el-form-item label="年利率 (%)" prop="interestRate" :rules="[{ required: true, type: 'number', min: 0, message: '请输入有效的利率', trigger: 'blur' }]">
            <el-input v-model.number="editFormData.interestRate" type="number" placeholder="请输入年利率" min="0" step="0.01" />
          </el-form-item>
          <el-form-item label="还款方式" prop="interestType">
            <el-select v-model="editFormData.interestType" style="width: 100%">
              <el-option v-for="opt in INTEREST_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="showEditModal = false; resetForm()">取消</el-button>
        <el-button type="primary" @click="handleEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Top, Bottom, Wallet, Plus, Money, CreditCard, Edit, Delete } from '@element-plus/icons-vue'
import { useRecords } from '../composables/useRecords'
import type { FinancialSourceType, FinancialPeriod, InvestmentType, InterestType, FinancialSource } from '../types/record'

const { incomeSources, expenseSources, investmentSources, loanSources, addFinancialSource, deleteFinancialSource, updateFinancialSource } = useRecords()

const CURRENCY_OPTIONS = [
  { value: 'CNY', label: 'CNY (¥)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'JPY', label: 'JPY (¥)' },
]
const CURRENCY_SYMBOLS: Record<string, string> = { CNY: '¥', USD: '$', EUR: '€', GBP: '£', JPY: '¥' }
const PERIOD_OPTIONS: { value: FinancialPeriod; label: string }[] = [
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
  { value: 'yearly', label: '每年' },
  { value: 'once', label: '一次性' },
]
const DAY_OF_MONTH_OPTIONS = Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `${i + 1}日` })).concat({ value: -1, label: '最后一天' })
const DAY_OF_WEEK_OPTIONS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 0, label: '周日' },
]
const INVESTMENT_TYPE_OPTIONS: { value: InvestmentType; label: string }[] = [
  { value: 'once', label: '一次性投资' },
  { value: 'recurring', label: '定期投资' },
]
const INTEREST_TYPE_OPTIONS: { value: InterestType; label: string }[] = [
  { value: 'equal-payment', label: '等额本息' },
  { value: 'equal-principal', label: '等额本金' },
  { value: 'interest-first', label: '先息后本' },
]
const INTEREST_TYPE_LABELS: Record<InterestType, string> = { 'equal-payment': '等额本息', 'equal-principal': '等额本金', 'interest-first': '先息后本' }

const showAddModal = ref(false)
const showEditModal = ref(false)
const currentType = ref<FinancialSourceType>('income')
const editingSource = ref<FinancialSource | null>(null)
const activeCollapseKeys = ref(['income', 'expense', 'investment', 'loan'])

const formData = reactive({
  name: '',
  currency: 'CNY',
  amount: undefined as number | undefined,
  period: 'monthly' as FinancialPeriod,
  dayOfMonth: -1,
  dayOfWeek: 6,
  investmentType: 'once' as InvestmentType,
  expectedReturn: undefined as number | undefined,
  principal: undefined as number | undefined,
  interestRate: undefined as number | undefined,
  interestType: 'equal-payment' as InterestType,
})

const editFormData = reactive({
  name: '',
  currency: 'CNY',
  amount: undefined as number | undefined,
  period: 'monthly' as FinancialPeriod,
  dayOfMonth: undefined as number | undefined,
  dayOfWeek: undefined as number | undefined,
  investmentType: 'once' as InvestmentType,
  expectedReturn: undefined as number | undefined,
  principal: undefined as number | undefined,
  interestRate: undefined as number | undefined,
  interestType: 'equal-payment' as InterestType,
})

const formRef = ref<FormInstance>()
const editFormRef = ref<FormInstance>()

const getDayOfWeekLabel = (dayOfWeek: number): string => {
  const option = DAY_OF_WEEK_OPTIONS.find(d => d.value === dayOfWeek)
  return option ? option.label : String(dayOfWeek)
}

const getDayOfMonthLabel = (dayOfMonth: number): string => {
  if (dayOfMonth === -1) return '最后一天'
  return `${dayOfMonth}日`
}

const formatAmount = (amount: number, currency: string) => {
  const formatter = new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${CURRENCY_SYMBOLS[currency] || ''}${formatter.format(amount)}`
}

const calculateMonthlyAmount = (amount: number, period: FinancialPeriod): number => {
  switch (period) {
    case 'daily': return amount * 30
    case 'weekly': return amount * 4
    case 'monthly': return amount
    case 'yearly': return amount / 12
    case 'once': return 0
    default: return amount
  }
}

const expectedMonthlyIncome = computed(() => {
  const incomeByCurrency: Record<string, number> = {}
  incomeSources.value.forEach((source) => {
    const monthly = calculateMonthlyAmount(source.amount, source.period)
    incomeByCurrency[source.currency] = (incomeByCurrency[source.currency] || 0) + monthly
  })
  return incomeByCurrency
})

const expectedMonthlyExpense = computed(() => {
  const expenseByCurrency: Record<string, number> = {}
  expenseSources.value.forEach((source) => {
    const monthly = calculateMonthlyAmount(source.amount, source.period)
    expenseByCurrency[source.currency] = (expenseByCurrency[source.currency] || 0) + monthly
  })
  return expenseByCurrency
})

const expectedMonthlyBalance = computed(() => {
  const balanceByCurrency: Record<string, number> = {}
  const allCurrencies = new Set([...Object.keys(expectedMonthlyIncome.value), ...Object.keys(expectedMonthlyExpense.value)])
  allCurrencies.forEach((currency) => {
    balanceByCurrency[currency] = (expectedMonthlyIncome.value[currency] || 0) - (expectedMonthlyExpense.value[currency] || 0)
  })
  return balanceByCurrency
})

const formatPeriod = (period: FinancialPeriod, record: FinancialSource): string => {
  const base = PERIOD_OPTIONS.find(p => p.value === period)?.label || period
  if (period === 'monthly' && record.dayOfMonth !== undefined) return `${base} ${getDayOfMonthLabel(record.dayOfMonth)}`
  if (period === 'weekly' && record.dayOfWeek !== undefined) return `${base} ${getDayOfWeekLabel(record.dayOfWeek)}`
  return base
}

const typeLabel = (type: FinancialSourceType): string => {
  const labels: Record<FinancialSourceType, string> = { income: '收入', expense: '支出', investment: '投资', loan: '贷款' }
  return labels[type]
}

const openAddModal = (type: FinancialSourceType) => {
  currentType.value = type
  formData.name = ''
  formData.currency = 'CNY'
  formData.amount = undefined
  formData.period = 'monthly'
  formData.dayOfMonth = -1
  formData.dayOfWeek = 6
  formData.investmentType = 'once'
  formData.expectedReturn = undefined
  formData.principal = undefined
  formData.interestRate = undefined
  formData.interestType = 'equal-payment'
  formRef.value?.resetFields()
  showAddModal.value = true
}

const openEditModal = (source: FinancialSource) => {
  editingSource.value = source
  currentType.value = source.type
  editFormData.name = source.name
  editFormData.currency = source.currency
  editFormData.amount = source.amount
  editFormData.period = source.period
  editFormData.dayOfMonth = source.dayOfMonth ?? (source.period === 'monthly' ? -1 : undefined)
  editFormData.dayOfWeek = source.dayOfWeek ?? (source.period === 'weekly' ? 6 : undefined)
  editFormData.investmentType = source.investmentType || 'once'
  editFormData.expectedReturn = source.expectedReturn
  editFormData.principal = source.principal
  editFormData.interestRate = source.interestRate
  editFormData.interestType = source.interestType || 'equal-payment'
  editFormRef.value?.resetFields()
  showEditModal.value = true
}

const resetForm = () => {
  formRef.value?.resetFields()
  editFormRef.value?.resetFields()
  editingSource.value = null
}

const handleAdd = async () => {
  try {
    if (!formRef.value) return
    await formRef.value.validate()
    const sourceData = {
      type: currentType.value,
      name: formData.name.trim(),
      currency: formData.currency,
      amount: formData.amount,
      period: formData.period,
      dayOfMonth: formData.period === 'monthly' ? formData.dayOfMonth : undefined,
      dayOfWeek: formData.period === 'weekly' ? formData.dayOfWeek : undefined,
      ...(currentType.value === 'investment' && { investmentType: formData.investmentType, expectedReturn: formData.expectedReturn }),
      ...(currentType.value === 'loan' && { principal: formData.principal, interestRate: formData.interestRate, interestType: formData.interestType }),
    }
    addFinancialSource(sourceData)
    ElMessage.success('添加成功')
    showAddModal.value = false
    resetForm()
  } catch {
    // validation failed
  }
}

const handleEdit = async () => {
  try {
    if (!editFormRef.value || !editingSource.value) return
    await editFormRef.value.validate()
    const updates: Partial<FinancialSource> = {
      name: editFormData.name.trim(),
      currency: editFormData.currency,
      amount: editFormData.amount,
      period: editFormData.period,
      dayOfMonth: editFormData.period === 'monthly' ? editFormData.dayOfMonth : undefined,
      dayOfWeek: editFormData.period === 'weekly' ? editFormData.dayOfWeek : undefined,
      ...(currentType.value === 'investment' && { investmentType: editFormData.investmentType, expectedReturn: editFormData.expectedReturn }),
      ...(currentType.value === 'loan' && { principal: editFormData.principal, interestRate: editFormData.interestRate, interestType: editFormData.interestType }),
    }
    updateFinancialSource(editingSource.value.id, updates)
    ElMessage.success('更新成功')
    showEditModal.value = false
    resetForm()
  } catch {
    // validation failed
  }
}

const handleDelete = (id: string) => {
  const result = deleteFinancialSource(id)
  if (result.success) ElMessage.success('删除成功')
  else ElMessage.error(result.message)
}
</script>

<style scoped>
.financial-config-page {
  padding: 24px;
}
.page-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
}
.summary-card {
  border-radius: 8px;
}
.summary-header {
  margin-bottom: 16px;
}
.summary-sub {
  color: #909399;
  font-size: 12px;
  display: block;
}
.summary-row {
  display: flex;
  justify-content: space-between;
}
.currency-label {
  color: #909399;
}
.amount {
  font-weight: bold;
  font-size: 18px;
}
.income-color {
  color: #52c41a;
}
.expense-color {
  color: #ff4d4f;
}
.balance-color {
  color: #1677ff;
}
.no-data {
  color: #909399;
}
.config-collapse {
  background: #fff;
}
.collapse-title {
  display: inline-flex;
  align-items: center;
}
.secondary-text {
  color: #909399;
}
</style>
