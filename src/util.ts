// SVG Arc helper functions (because arcs are otherwise difficult with SVG!)

interface Vec2 {
	x: number
	y: number
}

export function polarToCartesian (centerX: number, centerY: number, radius: number, degrees: number, out: Vec2) {
	const r = (degrees-90) * Math.PI / 180.0
	out.x = centerX + (radius * Math.cos(r))
	out.y = centerY + (radius * Math.sin(r))
	return out
}

// Create an SVG arc definition centred at x,y with radius,
// start and end angles (clockwise, in degrees)
export const svgArcPath = (function(){
	const _p0 = {x: 0, y: 0}
	const _p1 = {x: 0, y: 0}
	function svgArcPath (x: number, y: number, radius: number, startAngle: number, endAngle: number) {
		polarToCartesian(x, y, radius, endAngle, _p0)
		polarToCartesian(x, y, radius, startAngle, _p1)
		const arcSweep = endAngle - startAngle <= 180 ? '0' : '1'
		return 'M ' + _p0.x + ' ' + _p0.y +
			'A ' + radius + ' ' + radius + ' 0 ' + arcSweep + ' 0 ' + _p1.x + ' ' + _p1.y
	}
	return svgArcPath
}())

/**
 * Draw % of arc
 * @param {HTMLElement} el
 * @param {number} pct
 */
export function drawArc (el: SVGSVGElement, pct: number, radius: number, strokeWidth: number) {
	el.setAttribute('d',
		svgArcPath(
			radius, radius, radius - strokeWidth / 2, 0, pct * 360
		)
	)
}

/** Non-linear arc motion */
export function accel (t: number) {
	return Math.pow(t, 2.25)
}

export function fadeIn (el: any) {
	el.style.opacity = '1'
	el.classList.add('longpresser-fade-in')
}

export function removeFadeIn (el: any) {
	el.style.opacity = '0'
	el.classList.remove('longpresser-fade-in')
}
