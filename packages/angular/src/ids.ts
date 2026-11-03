import { Injectable } from '@angular/core'

/** Per-app counter. Server and client render in the same order, so IDs match on hydration. */
@Injectable({ providedIn: 'root' })
export class OpalineIds {
  private count = 0

  next(): string {
    return `n${++this.count}`
  }
}
