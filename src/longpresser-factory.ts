declare const m: Mithril.Static
import {polarToCartesian, svgArcPath, drawArc, accel, fadeIn, removeFadeIn} from './util'

const DEFAULT_DURATION = 1 * 1000
const RADIUS = 50
const STROKE_WIDTH = 8
const F_STROKE_WIDTH = 1

// in the absense of Pointer events support...
const DEVICE_NONE = 0
const DEVICE_MOUSE = 1
const DEVICE_TOUCH = 2

let device = DEVICE_NONE

interface Attrs {
	duration?: number
	fgStrokeColor: string
	bgStrokeColor: string
	bgFillColor: string
	textColor: string
	text: string
	onpressed?: () => void
}

//
// LongPresser factory component
//
// A type can be provided either for the function (as in
// this example) or for the vnode parameter.
//
// A state type is not necessary in this example because
// state is in the closure rather than on vnode.state.
//
export default (function LongPresser ({attrs}) {
	const duration: number = (+attrs.duration > 0) ? (+attrs.duration) * 1000 : DEFAULT_DURATION
	const fgStrokeColor: string = attrs.fgStrokeColor
	const bgStrokeColor: string = attrs.bgStrokeColor
	let isPressed = false
	let isFinished = false
	let pressT = 0
	let prevT = Date.now()
	let el: HTMLElement | undefined
	let elSvg: SVGSVGElement | undefined
	let elBgCircle: SVGCircleElement | undefined
	let elFgCircle: SVGCircleElement | undefined
	let elArc: SVGSVGElement | undefined
	let elText: SVGTextElement | undefined
	let elFgText: SVGTextElement | undefined

	return {
		oncreate ({dom}) {
			// Grab some elements we'll use a lot
			el = dom as HTMLElement
			elSvg = el.childNodes[0] as SVGSVGElement
			elBgCircle = elSvg.childNodes[0] as SVGCircleElement
			elArc = elSvg.childNodes[1] as SVGSVGElement
			elText = elSvg.childNodes[2] as SVGTextElement
			elFgCircle = elSvg.childNodes[3] as SVGCircleElement
			elFgText = elSvg.childNodes[4] as SVGTextElement

			// Add our own event listeners hidden from Mithril
			el.addEventListener('mousedown', () => {
				if (device !== DEVICE_TOUCH) {
					device = DEVICE_MOUSE
					if (!isPressed) {
						startPress()
					}
				}
			})
			el.addEventListener('mouseup', () => {
				if (device !== DEVICE_TOUCH) {
					device = DEVICE_MOUSE
					if (isPressed) {
						endPress()
					}
				}
			})
			el.addEventListener('touchstart', () => {
				if (device !== DEVICE_MOUSE) {
					device = DEVICE_TOUCH
					if (!isPressed) {
						startPress()
					}
				}
			})
			el.addEventListener('touchend', () => {
				if (device !== DEVICE_MOUSE) {
					device = DEVICE_TOUCH
					if (isPressed) {
						endPress()
					}
				}
			})
		},

		view ({attrs}) {
			console.log('LongPresser view called')
			return m('div', {class: 'longpresser', style: {cursor: isFinished ? 'default' : 'pointer'}, onpressed: attrs.onpressed},
				m('svg', {viewBox: `0 0 ${RADIUS*2} ${RADIUS*2}`, version: '1.1', xmlns: 'http://www.w3.org/2000/svg'},
					m('circle', {cx: RADIUS, cy: RADIUS, r: RADIUS-STROKE_WIDTH/2, style: {fill: attrs.bgFillColor, stroke: isFinished ? attrs.fgStrokeColor : attrs.bgStrokeColor, strokeWidth: STROKE_WIDTH}}),
					m('path', {d: svgArcPath(RADIUS, RADIUS, RADIUS-STROKE_WIDTH/2, 0, 360.0 * accel(pressT / duration)), style: {fill: 'transparent', stroke: attrs.fgStrokeColor, strokeWidth: STROKE_WIDTH}}),
					m('text', {x: RADIUS, y: RADIUS, style: {textAnchor: 'middle', dominantBaseline: 'middle', fontSize: '0.95em', fill: attrs.textColor}}, attrs.text),
					m('circle', {cx: RADIUS, cy: RADIUS, r: RADIUS-F_STROKE_WIDTH/2, style: {fill: '#EEE', stroke: '#CCC', strokeWidth: F_STROKE_WIDTH, opacity: isFinished ? 1 : 0}}),
					m('text', {x: RADIUS, y: RADIUS, style: {textAnchor: 'middle', dominantBaseline: 'middle', fontSize: '1.5em', fill: '#000', opacity: isFinished ? 1 : 0}}, m.trust('&#10004'))
				)
			)
		}
	} as Mithril.TComponent<Attrs,{}>

	// Internally used methods

	function startPress() {
		isPressed = true
		prevT = Date.now()
		requestAnimationFrame(() => {updatePress()})
	}

	function endPress() {
		isPressed = false
	}

	function updatePress() {
		if (!isPressed) {
			updateRelease()
			return
		}
		const t = Date.now()
		const dt = t - prevT
		pressT = Math.min(pressT + dt, duration)
		elArc && drawArc(elArc, accel(pressT / duration), RADIUS, STROKE_WIDTH)
		prevT = t
		if (pressT >= duration) {
			finish()
			return // cancel the animation loop by exiting here
		}
		// Keep animation running
		requestAnimationFrame(() => {updatePress()})
	}

	function updateRelease() {
		const t = Date.now()
		const dt = t - prevT
		pressT = Math.max(pressT - dt, 0)
		elArc && drawArc(elArc, accel(pressT / duration), RADIUS, STROKE_WIDTH)
		prevT = t
		if (pressT <= 0) {
			return // cancel the animation loop by exiting here
		}
		// Keep animation running
		// Use updatPress in case isPressed state changes
		requestAnimationFrame(() => {updatePress()})
	}

	function finish() {
		if (!el || !elArc || !elBgCircle) return
		drawArc(elArc, 0, RADIUS, STROKE_WIDTH)
		el.style.cursor = 'default'
		elBgCircle.style.stroke = fgStrokeColor
		pressT = 0
		isPressed = false
		isFinished = true
		fadeIn(elFgCircle)
		fadeIn(elFgText)
		el.dispatchEvent(new Event('pressed'))
	}

	function reset() {
		if (!el || !elArc || !elBgCircle) return
		isPressed = false
		pressT = 0
		elBgCircle.style.stroke = bgStrokeColor
		el.style.cursor = 'pointer'
		drawArc(elArc, 0, RADIUS, STROKE_WIDTH)
		isFinished = false
		// Hide the 'finished' elements
		removeFadeIn(elFgCircle)
		removeFadeIn(elFgText)
	}
}) as Mithril.TFactoryComponent<Attrs,{}>
