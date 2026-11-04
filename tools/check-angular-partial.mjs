// npm must get partial-compiled Angular code; full Ivy output is tied to one Angular patch version.
import { readFileSync } from 'node:fs'

const fesm = readFileSync('packages/angular/dist/fesm2022/inlaylab-opaline-angular.mjs', 'utf8')
if (!fesm.includes('ɵɵngDeclareComponent')) {
  console.error('packages/angular was built in full compilation mode; set compilationMode: partial')
  process.exit(1)
}
console.log('angular: partial compilation ok')
