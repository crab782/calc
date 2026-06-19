<template>
  <el-container style="min-height: 100vh; flex-direction: row">
    <Sidebar v-if="isSidebarOpen" @collapse="isSidebarOpen = false" />
    <el-container style="flex: 1">
      <el-main style="overflow: auto; padding: 24px">
        <el-button
          v-if="!isSidebarOpen"
          type="primary"
          @click="isSidebarOpen = true"
          style="position: fixed; top: 16px; left: 16px; z-index: 1050"
        >
          <el-icon><Menu /></el-icon>
        </el-button>
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import { Menu } from '@element-plus/icons-vue'
import Sidebar from './components/Sidebar.vue'
import { createTheme } from './composables/useTheme'
import { createI18n } from './composables/useLanguage'

// Initialize theme and language providers
createTheme()
createI18n()

const isSidebarOpen = ref(true)
</script>
