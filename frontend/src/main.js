import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700.css'
import '@fontsource/big-shoulders-stencil-display/800'
import './style.css'

const app = createApp(App)
app.use(router)
app.mount('#app')
