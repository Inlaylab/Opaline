import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node'
import express from 'express'
import { join } from 'node:path'

const browserDist = join(import.meta.dirname, '../browser')
const app = express()
// Angular rejects unknown Host headers (SSRF guard); the sample only serves localhost.
const angularApp = new AngularNodeAppEngine({ allowedHosts: ['localhost'] })

app.use(express.static(browserDist, { maxAge: '1y', index: false, redirect: false }))
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next)
})

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000
  app.listen(port, () => console.log(`listening on http://localhost:${port}`))
}

export const reqHandler = createNodeRequestHandler(app)
