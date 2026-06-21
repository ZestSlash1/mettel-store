/**
 * Single place that imports GSAP and registers the (free) ScrollTrigger plugin.
 * Importing from here guarantees the plugin is registered exactly once, no
 * matter which module pulls in gsap first.
 *
 * GSAP 3.13+ ships ScrollTrigger and the other standard plugins free under the
 * standard "no charge" license — no Club token required.
 */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'

if (!gsap.core.globals().ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger)
}
if (!gsap.core.globals().Flip) {
  gsap.registerPlugin(Flip)
}

export { gsap, ScrollTrigger, Flip }
