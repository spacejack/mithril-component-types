declare const m: Mithril.Static

import LongPresserPojo from './longpresser-pojo'
import LongPresserClass from './longpresser-class'
import LongPresserFactory from './longpresser-factory'

let pojoWasPressed = false
let classWasPressed = false
let factoryWasPressed = false
let numExtras = 0

export default {
	view (vnode) {
		return m('div', [
			m('.pressme',
				// With a POJO component the attrs type is inferred & checked
				m(LongPresserPojo, {
					text: "Press Me",
					textColor: '#FFF',
					fgStrokeColor: '#F00',
					bgStrokeColor: '#A00',
					bgFillColor: '#800',
					duration: 0.75,
					onpressed: () => {pojoWasPressed = true}
				})
			),

			m('.pressme',
				// With a class component the type for attrs cannot be inferred.
				m(LongPresserClass, {
					text: "Press Me",
					textColor: '#FFF',
					fgStrokeColor: '#F00',
					bgStrokeColor: '#A00',
					bgFillColor: '#800',
					duration: 0.75,
					onpressed: () => {classWasPressed = true}
				})
			),

			m('.pressme',
				// With a factory component the attrs type is inferred & checked
				m(LongPresserFactory, {
					text: "Press Me",
					textColor: '#FFF',
					fgStrokeColor: '#F00',
					bgStrokeColor: '#A00',
					bgFillColor: '#800',
					duration: 0.75,
					onpressed: () => {factoryWasPressed = true}
				})
			),

			m('p', {style: {marginLeft: '2em'}}, pojoWasPressed ? 'POJO component pressed!' : ''),
			m('p', {style: {marginLeft: '2em'}}, classWasPressed ? 'Class component pressed!' : ''),
			m('p', {style: {marginLeft: '2em'}}, factoryWasPressed ? 'Factory component pressed!' : ''),
		])
	}
} as Mithril.Component
