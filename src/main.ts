import * as m from 'mithril'

import app from './app'

window.addEventListener('load', () => {
	m.mount(document.getElementById('app') as HTMLElement, app)
})
