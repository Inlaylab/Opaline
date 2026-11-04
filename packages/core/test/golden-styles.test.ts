import { aura } from '../src/styles/aura.ts'
import { gradient } from '../src/styles/gradient.ts'
import { morph } from '../src/styles/morph.ts'
import { goldenSuite } from './golden.ts'

goldenSuite(morph, 'morph')
goldenSuite(gradient, 'gradient')
goldenSuite(aura, 'aura')
goldenSuite(morph, 'morph-soft', { finish: 'soft' })
goldenSuite(morph, 'morph-gloss', { finish: 'gloss' })
goldenSuite(gradient, 'gradient-soft', { finish: 'soft' })
goldenSuite(gradient, 'gradient-gloss', { finish: 'gloss' })
