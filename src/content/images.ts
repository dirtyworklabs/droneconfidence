import type { ImageSlotKey } from '@/types'

export type FallbackTreatment =
  | 'flight-path'
  | 'controller'
  | 'orbit'
  | 'framing'
  | 'topography'
  | 'credential'

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
    fallbackCaption: '',
  },

  'session-first-flight': {
    src: '/images/dc-first-flight.jpg',
    alt: 'A small consumer camera drone being flown during a practical drone training session',
    fallback: 'controller',
    fallbackCaption: 'Pre-flight · controls · first hover',
  },

  'session-fly-with-confidence': {
    src: '/images/dc-fly-with-confidence.jpg',
    alt: 'A consumer camera drone flying while its pilot practises confident drone control',
    fallback: 'orbit',
    fallbackCaption: 'Orientation · turns · repeatable paths',
  },

  'session-photo-video': {
    src: '/images/dc-photo-video.jpg',
    alt: 'Aerial coastal landscape photography captured using a camera drone',
    fallback: 'framing',
    fallbackCaption: 'Exposure · movement · framing',
  },

  'location-south': {
    src: '/images/gwawley-park-location.jpg',
    alt: 'Open green space at Gwawley Park, Taren Point in Sydney’s south',
    fallback: 'topography',
    fallbackCaption: 'Sydney south · Taren Point',
  },

  'location-north': {
    src: '/images/north-ryde-common-location.jpg',
    alt: 'Open green space at North Ryde Common in Sydney’s north',
    fallback: 'topography',
    fallbackCaption: 'Sydney north · North Ryde',
  },

  'about-tom': {
    src: '/images/in-motion-aero-atc.jpg',
    alt: 'Tom Gerrard during commercial drone operations with In Motion Aero',
    fallback: 'credential',
    fallbackCaption: 'In Motion Aero · commercial drone operations',
  },
}

export const getImageSlot = (key: ImageSlotKey): ImageSlot => imageSlots[key]

export const hasPhoto = (key: ImageSlotKey): boolean =>
  imageSlots[key].src.trim().length > 0