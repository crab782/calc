import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as echarts from 'echarts'
import VChart from 'vue-echarts'
import './index.css'

const app = createApp(App)

app.use(router)
app.use(ElementPlus)
app.component('VChart', VChart)

app.mount('#root')
