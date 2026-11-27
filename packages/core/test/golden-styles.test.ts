import { clay } from '../src/styles/clay.ts'
import { cosmos } from '../src/styles/cosmos.ts'
import { critters } from '../src/styles/critters.ts'
import { doodle } from '../src/styles/doodle.ts'
import { folk } from '../src/styles/folk.ts'
import { aura } from '../src/styles/aura.ts'
import { gradient } from '../src/styles/gradient.ts'
import { initials } from '../src/styles/initials.ts'
import { morph } from '../src/styles/morph.ts'
import { pip } from '../src/styles/pip.ts'
import { plush } from '../src/styles/plush.ts'
import { goldenSuite } from './golden.ts'

goldenSuite(morph, 'morph')
goldenSuite(gradient, 'gradient')
goldenSuite(aura, 'aura')
goldenSuite(morph, 'morph-soft', { finish: 'soft' })
goldenSuite(morph, 'morph-gloss', { finish: 'gloss' })
goldenSuite(gradient, 'gradient-soft', { finish: 'soft' })
goldenSuite(gradient, 'gradient-gloss', { finish: 'gloss' })
goldenSuite(clay, 'clay')
goldenSuite(clay, 'clay-gloss', { finish: 'gloss' })
goldenSuite(clay, 'clay-hood', { body: 'hood' })
goldenSuite(initials, 'initials')
goldenSuite(initials, 'initials-square', { shape: 'square' })
goldenSuite(plush, 'plush')
goldenSuite(plush, 'plush-glasses', { accessory: 'glasses' })
goldenSuite(pip, 'pip')
goldenSuite(pip, 'pip-gloss', { finish: 'gloss' })
goldenSuite(gradient, 'gradient-gummy', { finish: 'gummy' })
goldenSuite(plush, 'plush-flat', { material: 'flat' })
goldenSuite(critters, 'critters')
goldenSuite(critters, 'critters-gummy', { finish: 'gummy' })
goldenSuite(cosmos, 'cosmos')
goldenSuite(folk, 'folk')
goldenSuite(doodle, 'doodle')
goldenSuite(morph, 'morph-status', { status: 'away' })
