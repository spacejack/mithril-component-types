import * as m from 'mithril'
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

interface State {
	duration: number
	fgStrokeColor: string
	bgStrokeColor: string
	isPressed: boolean
	isFinished: boolean
	pressT: number
	prevT: number
	// These are not initialized until oncreate runs, so
	// they must be declared as possibly undefined.
	el: HTMLElement | undefined
	elSvg: SVGSVGElement | undefined
	elBgCircle: SVGCircleElement | undefined
	elFgCircle: SVGCircleElement | undefined
	elArc: SVGSVGElement | undefined
	elText: SVGTextElement | undefined
	elFgText: SVGTextElement | undefined
	// Component's custom methods
	startPress (this: State): void
	updatePress (this: State): void
	endPress (this: State): void
	updateRelease (this: State): void
	finish (this: State): void
	reset (this: State): void
}

//
// LongPresser component
//
export default {
	el: undefined,
	elSvg: undefined,
	elBgCircle: undefined,
	elFgCircle: undefined,
	elArc: undefined,
	elText: undefined,
	elFgText: undefined,
	duration: 0,
	fgStrokeColor: '#FFF',
	bgStrokeColor: '#FFF',
	isPressed: false,
	isFinished: false,
	pressT: 0,
	prevT: 0,

	oninit ({attrs}) {
		// Set up state vars
		this.duration = attrs.duration != null ? attrs.duration * 1000 : DEFAULT_DURATION
		this.fgStrokeColor = attrs.fgStrokeColor
		this.bgStrokeColor = attrs.bgStrokeColor
		this.isPressed = false
		this.pressT = 0
		this.isFinished = false
		this.prevT = Date.now()
	},

	oncreate ({dom}) {
		// Grab some elements we'll use a lot
		this.el = dom as HTMLElement
		this.elSvg = this.el.childNodes[0] as SVGSVGElement
		this.elBgCircle = this.elSvg.childNodes[0] as SVGCircleElement
		this.elArc = this.elSvg.childNodes[1] as SVGSVGElement
		this.elText = this.elSvg.childNodes[2] as SVGTextElement
		this.elFgCircle = this.elSvg.childNodes[3] as SVGCircleElement
		this.elFgText = this.elSvg.childNodes[4] as SVGTextElement

		// Add our own event listeners hidden from Mithril
		this.el.addEventListener('mousedown', () => {
			if (device !== DEVICE_TOUCH) {
				device = DEVICE_MOUSE
				if (!this.isPressed) {
					this.startPress()
				}
			}
		})
		this.el.addEventListener('mouseup', () => {
			if (device !== DEVICE_TOUCH) {
				device = DEVICE_MOUSE
				if (this.isPressed) {
					this.endPress()
				}
			}
		})
		this.el.addEventListener('touchstart', () => {
			if (device !== DEVICE_MOUSE) {
				device = DEVICE_TOUCH
				if (!this.isPressed) {
					this.startPress()
				}
			}
		})
		this.el.addEventListener('touchend', () => {
			if (device !== DEVICE_MOUSE) {
				device = DEVICE_TOUCH
				if (this.isPressed) {
					this.endPress()
				}
			}
		})
	},

	view ({attrs}) {
		console.log('LongPresser view called')
		return m('div', {class: 'longpresser', style: {cursor: this.isFinished ? 'default' : 'pointer'}, onpressed: attrs.onpressed},
			m('svg', {viewBox: `0 0 ${RADIUS*2} ${RADIUS*2}`, version: '1.1', xmlns: 'http://www.w3.org/2000/svg'},
				m('circle', {cx: RADIUS, cy: RADIUS, r: RADIUS-STROKE_WIDTH/2, style: {fill: attrs.bgFillColor, stroke: this.isFinished ? attrs.fgStrokeColor : attrs.bgStrokeColor, strokeWidth: STROKE_WIDTH}}),
				m('path', {d: svgArcPath(RADIUS, RADIUS, RADIUS-STROKE_WIDTH/2, 0, 360.0 * accel(this.pressT / this.duration)), style: {fill: 'transparent', stroke: attrs.fgStrokeColor, strokeWidth: STROKE_WIDTH}}),
				m('text', {x: RADIUS, y: RADIUS, style: {textAnchor: 'middle', dominantBaseline: 'middle', fontSize: '0.95em', fill: attrs.textColor}}, attrs.text),
				m('circle', {cx: RADIUS, cy: RADIUS, r: RADIUS-F_STROKE_WIDTH/2, style: {fill: '#EEE', stroke: '#CCC', strokeWidth: F_STROKE_WIDTH, opacity: this.isFinished ? 1 : 0}}),
				m('text', {x: RADIUS, y: RADIUS, style: {textAnchor: 'middle', dominantBaseline: 'middle', fontSize: '1.5em', fill: '#000', opacity: this.isFinished ? 1 : 0}}, m.trust('&#10004'))
			)
		)
	},

	// Internally used methods

	// Custom methods don't infer 'this' type (why?)
	startPress (this: State) {
		this.isPressed = true
		this.prevT = Date.now()
		requestAnimationFrame(() => {this.updatePress()})
	},

	endPress (this: State) {
		this.isPressed = false
	},

	updatePress (this: State) {
		if (!this.isPressed) {
			this.updateRelease()
			return
		}
		const t = Date.now()
		const dt = t - this.prevT
		this.pressT = Math.min(this.pressT + dt, this.duration)
		this.elArc && drawArc(this.elArc, accel(this.pressT / this.duration), RADIUS, STROKE_WIDTH)
		this.prevT = t
		if (this.pressT >= this.duration) {
			this.finish()
			return // cancel the animation loop by exiting here
		}
		// Keep animation running
		requestAnimationFrame(() => {this.updatePress()})
	},

	updateRelease (this: State) {
		const t = Date.now()
		const dt = t - this.prevT
		this.pressT = Math.max(this.pressT - dt, 0)
		this.elArc && drawArc(this.elArc, accel(this.pressT / this.duration), RADIUS, STROKE_WIDTH)
		this.prevT = t
		if (this.pressT <= 0) {
			return // cancel the animation loop by exiting here
		}
		// Keep animation running
		// Use updatPress in case isPressed state changes
		requestAnimationFrame(() => {this.updatePress()})
	},

	finish (this: State) {
		if (!this.el || !this.elArc || !this.elBgCircle) {
			return
		}
		drawArc(this.elArc, 0, RADIUS, STROKE_WIDTH)
		this.el.style.cursor = 'default'
		this.elBgCircle.style.stroke = this.fgStrokeColor
		this.pressT = 0
		this.isPressed = false
		this.isFinished = true
		fadeIn(this.elFgCircle)
		fadeIn(this.elFgText)
		this.el.dispatchEvent(new Event('pressed'))
	},

	reset (this: State) {
		if (!this.el || !this.elArc || !this.elBgCircle) {
			return
		}
		this.isPressed = false
		this.pressT = 0
		this.elBgCircle.style.stroke = this.bgStrokeColor
		this.el.style.cursor = 'pointer'
		drawArc(this.elArc, 0, RADIUS, STROKE_WIDTH)
		this.isFinished = false
		// Hide the 'finished' elements
		removeFadeIn(this.elFgCircle)
		removeFadeIn(this.elFgText)
	}
} as Mithril.Component<Attrs,State> & State
