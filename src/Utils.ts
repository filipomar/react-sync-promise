import { PendingPromise, RejectedPromise, ResolvedPromise, SyncPromise, SyncPromiseState } from '.';

/** @example isPending(usePromise(new Promise(() => void 0))) */
export const isPending = <T, E = unknown>(promise: SyncPromise<T, E>): promise is PendingPromise => promise.state === SyncPromiseState.PENDING;

/** @example isResolved(usePromise(Promise.resolve('I have resolve'))) */
export const isResolved = <T, E = unknown>(promise: SyncPromise<T, E>): promise is ResolvedPromise<T> => promise.state === SyncPromiseState.RESOLVED;

/** @example isRejected(usePromise(Promise.reject('I have no resolve'))) */
export const isRejected = <T, E = unknown>(promise: SyncPromise<T, E>): promise is RejectedPromise<E> => promise.state === SyncPromiseState.REJECTED;

/** @example ifUnresolved(usePromise(Promise.reject('I have no resolve')), 'I am unresolved') */
export const ifUnresolved = <T, E = unknown>(promise: SyncPromise<T, E>, otherwise: T): T => (isResolved(promise) ? promise.value : otherwise);

/** @example ifNotRejected(usePromise(Promise.reject('I have no resolve')), 'I am not rejected') */
export const ifNotRejected = <T, E = unknown>(promise: SyncPromise<T, E>, otherwise: E): E => (isRejected(promise) ? promise.value : otherwise);
