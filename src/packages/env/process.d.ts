/**
 * Global augmentation of `NodeJS.Process` with Barista's plugin-singleton
 * guard flags.
 *
 * Each `baristaHas*` flag marks whether the corresponding plugin has already
 * been registered in the current process, so a plugin can short-circuit on a
 * second `.use(...)` and avoid registering its hooks twice. Currently only
 * {@link baristaHasEnv} is read (by the {@link env} plugin); the remaining
 * flags are reserved for the same pattern in the other plugins.
 */
declare global {
	namespace NodeJS {
		interface Process {
			/** Set once the {@link env} plugin has validated and injected the environment. */
			baristaHasEnv: boolean;
			/** Reserved guard for a single CORS plugin registration. */
			baristaHasCors: boolean;
			/** Reserved guard for a single {@link responseMapper} registration. */
			baristaHasResponseMapper: boolean;
			/** Reserved guard for a single {@link errorHandler} registration. */
			baristaHasErrorHandler: boolean;
		}
	}
}

export {};
