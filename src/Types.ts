export enum SyncPromiseState {
    PENDING = 'PENDING',
    RESOLVED = 'RESOLVED',
    REJECTED = 'REJECTED',
}

type WithState<S extends SyncPromiseState> = Readonly<{ state: S }>;
type WithValue<V> = Readonly<{ value: V }>;

export type PendingPromise = WithState<SyncPromiseState.PENDING>;
export type ResolvedPromise<T> = WithState<SyncPromiseState.RESOLVED> & WithValue<T>;
export type RejectedPromise<E> = WithState<SyncPromiseState.REJECTED> & WithValue<E>;

/**
 * Synchronous promise hook result
 *
 * Use helper functions to infer actual type or play around with the state enum if you are stubborn
 */
export type SyncPromise<T, E = unknown> = PendingPromise | ResolvedPromise<T> | RejectedPromise<E>;
