export type * from './types'

/**
 * Define a module with full TypeScript inference.
 *
 * @example
 * export default defineModule({
 *   id:      'forms',
 *   name:    'Formularze',
 *   version: '1.0.0',
 *   routes(app, { requireAuth }) {
 *     app.post('/submit', ...)
 *     app.get('/submissions', requireAuth, ...)
 *   },
 * })
 */
export function defineModule(config: import('./types').OverCMSModule): import('./types').OverCMSModule {
  return config
}
