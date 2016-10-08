declare const m: Mithril.Static

import app from './app'

window.addEventListener('load', () => {
	m.mount(document.getElementById('app') as HTMLElement, app)
})
