import type { ImageSlotKey } from '@/types'

export type FallbackTreatment = 'flight-path' | 'controller' | 'orbit' | 'framing' | 'topography' | 'portrait'

export interface ImageSlot {
  /**
   * Path to real photography once supplied, e.g. '/images/hero.jpg'.
   * Leave empty and a designed graphical treatment is rendered instead.
   */
  src: string
  /** Optional 2x / wide art-direction source set. */
  srcSet?: string
  alt: string
  /** Designed treatment used until photography exists. */
  fallback: FallbackTreatment
  /** Short caption shown inside the designed fallback. */
  fallbackCaption: string
  width?: number
  height?: number
}

/**
 * Intentional image slots. Real photography can be dropped in here later
 * without touching a single page component or redesigning any layout.
 *
 * Guidance for replacements: genuine outdoor consumer-drone context only.
 * No military aircraft, no FPV racing, no cinema or heavy-lift rigs, no
 * agricultural drones, no AI-generated hardware.
 */
export const imageSlots: Record<ImageSlotKey, ImageSlot> = {
  hero: {
    src: '',
    alt: 'A small consumer camera drone flying in open Sydney parkland',
    fallback: 'flight-path',
    fallbackCaption: 'Open parkland · light wind · clear airspace',
  },
  'session-first-flight': {
    src: '',
    alt: 'Hands on a drone controller, preparing a consumer drone for take-off',
    fallback: 'controller',
    fallbackCaption: 'Pre-flight · controls · first hover',
  },
  'session-fly-with-confidence': {
    src: '',
    alt: 'A consumer drone manoeuvring in flight above open ground',
    fallback: 'orbit',
    fallbackCaption: 'Orientation · turns · repeatable paths',
  },
  'session-photo-video': {
    src: '',
    alt: 'An aerial photograph taken from a consumer camera drone',
    fallback: 'framing',
    fallbackCaption: 'Exposure · movement · framing',
  },
  'location-south': {
    src: '',
    alt: 'Open green space in Sydney’s south used as a drone training area',
    fallback: 'topography',
    fallbackCaption: 'Sydney south · Taren Point',
  },
  'location-north': {
    src: '',
    alt: 'Open green space in Sydney’s north used as a drone training area',
    fallback: 'topography',
    fallbackCaption: 'Sydney north · North Ryde',
  },
  'about-tom': {
    src: '',
    alt: 'Tom Gerrard, founder of Drone Confidence',
    fallback: 'portrait',
    fallbackCaption: 'Tom Gerrard',
  },
}

export const getImageSlot = (key: ImageSlotKey): ImageSlot => imageSlots[key]

export const hasPhoto = (key: ImageSlotKey): boolean => imageSlots[key].src.trim().length > 0
