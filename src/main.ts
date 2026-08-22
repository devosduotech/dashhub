import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Dashboard from '@/views/Dashboard.vue'
import SshTerminalPage from '@/views/SshTerminalPage.vue'
import '@/assets/styles/main.scss'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/ssh/:connectionId', name: 'ssh-terminal', component: SshTerminalPage, props: true, meta: { fullscreen: true } },
    { path: '/:pageName', name: 'page', component: Dashboard, props: (route) => ({ pageName: route.params.pageName }) },
    { path: '/page/:index', name: 'page-by-index', component: Dashboard, props: true }
  ]
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
