import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/index.css'
import App from './App.vue'
import router from './router'
import { installAssetCssVariables } from './utils/assets'

if (import.meta.env.PROD && import.meta.env.BASE_URL !== '/' && !window.location.hash) {
	const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')
	if (window.location.pathname.startsWith(basePath + '/')) {
		const subPath = window.location.pathname.slice(basePath.length)
		if (subPath && subPath !== '/') {
			window.location.replace(
				`${window.location.origin}${basePath}/#${subPath}${window.location.search}`,
			)
		}
	}
}

installAssetCssVariables()

createApp(App).use(createPinia()).use(router).mount('#app')
