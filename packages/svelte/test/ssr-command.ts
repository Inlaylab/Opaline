import type { BrowserCommand } from 'vitest/node'

/** Server-renders the test harness with these props and returns the body HTML. */
export const ssrRender: BrowserCommand<[props: Record<string, unknown>]> = async (ctx, props) => {
  const vite = ctx.project.vite
  const { default: Harness } = await vite.ssrLoadModule('/test/Harness.svelte')
  const { render } = await vite.ssrLoadModule('svelte/server')
  return render(Harness, { props: { initial: props } }).body
}

/** Server-renders an avatar group with these props and returns the body HTML. */
export const ssrRenderGroup: BrowserCommand<[props: Record<string, unknown>]> = async (
  ctx,
  props,
) => {
  const vite = ctx.project.vite
  const { default: GroupHarness } = await vite.ssrLoadModule('/test/GroupHarness.svelte')
  const { render } = await vite.ssrLoadModule('svelte/server')
  return render(GroupHarness, { props }).body
}
