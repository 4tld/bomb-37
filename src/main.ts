import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import './style/main.styl'
import { router } from './routes'

export const Vue = createApp(App)
Vue.use(router)
Vue.use(createPinia())
Vue.mount('#app')
