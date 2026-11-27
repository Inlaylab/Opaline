export {
  adjust,
  contrast,
  cssVar,
  hexToOklch,
  oklchToHex,
  resolveVars,
  type Oklch,
} from './color.ts'
export {
  createAvatar,
  type Avatar,
  type BaseOptions,
  type RenderContext,
  type Rendered,
  type Style,
} from './create.ts'
export { avatarGroup, type GroupLayout, type GroupMember } from './group.ts'
export { createIds } from './ids.ts'
export { createRng, hash, type Rng } from './prng.ts'
export { normalizeSeed } from './seed.ts'
export { el, escapeXml, num, type Attrs } from './svg.ts'
export type { BlobOptions } from './styles/blob.ts'
export type { AuraOptions } from './styles/aura.ts'
export type { ClayOptions } from './styles/clay.ts'
export type { InitialsOptions } from './styles/initials.ts'
export type { PlushOptions } from './styles/plush.ts'
export type { PipForm, PipOptions } from './styles/pip.ts'
export type { GradientForm, GradientOptions } from './styles/gradient.ts'
export type { Critter, CrittersOptions } from './styles/critters.ts'
export type { CosmosObject, CosmosOptions } from './styles/cosmos.ts'
export type { FolkOptions } from './styles/folk.ts'
export type { DoodleOptions } from './styles/doodle.ts'
export type { PersonaExpression, PersonaMood, PersonaShape, Scheme } from './parts/persona.ts'
export { statusLabel, type Status } from './parts/status.ts'
export type { Accessory } from './parts/accessory.ts'
export type { Expression, Mood } from './parts/face.ts'
export type { Family } from './parts/shape.ts'
export type { Shape } from './parts/tile.ts'
export type { Finish } from './parts/finish.ts'
export type { PaletteName } from './parts/palette.ts'

import type { AuraOptions as _Aura } from './styles/aura.ts'
import type { ClayOptions as _Clay } from './styles/clay.ts'
import type { InitialsOptions as _Initials } from './styles/initials.ts'
import type { PlushOptions as _Plush } from './styles/plush.ts'
import type { PipForm as _PipForm, PipOptions as _Pip } from './styles/pip.ts'
import type {
  GradientForm as _GradientForm,
  GradientOptions as _Gradient,
} from './styles/gradient.ts'
import type { CrittersOptions as _Critters } from './styles/critters.ts'
import type { CosmosOptions as _Cosmos } from './styles/cosmos.ts'
import type { FolkOptions as _Folk } from './styles/folk.ts'
import type { DoodleOptions as _Doodle } from './styles/doodle.ts'
import type { Finish as _Finish } from './parts/finish.ts'
import type { Expression as _Expression, Mood as _Mood } from './parts/face.ts'
import type {
  PersonaExpression as _PE,
  PersonaMood as _PM,
  PersonaShape as _PS,
} from './parts/persona.ts'
import type { Status as _Status } from './parts/status.ts'

/** Options several styles share with different value sets, widened to every value any style takes. */
type Shared = {
  finish?: _Finish
  mood?: _Mood | _PM
  expression?: _Expression | _PE
  shape?: _PS
  form?: _PipForm | _GradientForm
}
type AllOptions = _Clay &
  _Aura &
  _Initials &
  _Plush &
  _Pip &
  _Gradient &
  _Critters &
  _Cosmos &
  _Folk &
  _Doodle
/**
 * Every option of every style, for wrappers that take any style. A style ignores what it does not
 * use, and unknown values fall back to the style's default.
 */
export type LookOptions = Omit<AllOptions, keyof Shared> & Shared & { status?: _Status }
