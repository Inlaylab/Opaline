import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser'
import { App } from './app/app'
import { serverConfig } from './app/config'

export default (context: BootstrapContext) => bootstrapApplication(App, serverConfig, context)
