export interface SeedWork {
  kind: 'work'
  id: string
  title: string
  subtitle: string
  year: string
  tags: string[]
  accent: string
  poster: string
  intro: string
  concept: string
  link: string
}

export declare const WORK_SEED: SeedWork[]
