import {
  mergeApplicationConfig,
  provideZonelessChangeDetection,
  type ApplicationConfig,
} from '@angular/core'
import { provideClientHydration } from '@angular/platform-browser'
import { provideServerRendering, withRoutes, RenderMode } from '@angular/ssr'

export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection(), provideClientHydration()],
}

export const serverConfig = mergeApplicationConfig(appConfig, {
  providers: [provideServerRendering(withRoutes([{ path: '**', renderMode: RenderMode.Server }]))],
})
