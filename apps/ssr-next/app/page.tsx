import { gradient } from '@inlaylab/opaline/gradient'
import { Avatar } from '@inlaylab/opaline-react'
import { PIXEL } from '../../../tools/ssr-e2e-pixel.ts'

// A server component: only the photo part of Avatar ships client code.
export default function Page() {
  return (
    <main>
      <Avatar seed="ada@inlay.dev" look={gradient} src={PIXEL} alt="Ada" />
      <Avatar seed="ada@inlay.dev" look={gradient} />
    </main>
  )
}
