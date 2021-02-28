import { useState, useEffect } from 'react';

import { Stoppable } from './Stoppable';

export enum SyncPromiseState {
    PENDING = 'PENDING',
    RESOLVED = 'RESOLVED',
    REJECTED = 'REJECTED',
}

type WithState<S extends SyncPromiseState> = { readonly state: S };
type WithValue<V> = { readonly value: V };

type PendingPromise = WithState<SyncPromiseState.PENDING>;
type ResolvedPromise<T> = WithState<SyncPromiseState.RESOLVED> & WithValue<T>;
type RejectedPromise<E> = WithState<SyncPromiseState.REJECTED> & WithValue<E>;

/**
 * Synchronous promise hook result
 *
 * Use helper functions to infer actual type or play around with the state enum if you are stubborn
 */
export type SyncPromise<T, E> = PendingPromise | ResolvedPromise<T> | RejectedPromise<E>;

const createPending = (): PendingPromise => ({ state: SyncPromiseState.PENDING });
const createResolved = <T>(value: T): ResolvedPromise<T> => ({ state: SyncPromiseState.RESOLVED, value });
const createRejected = <E>(value: E): RejectedPromise<E> => ({ state: SyncPromiseState.REJECTED, value });

/**
 * Handle promises synchronously in react!
 *
 * @example usePromise(Promise.resolve('Execute order 66'))
 * @example usePromise<string, Error>(Promise.resolve('Execute order 66'))
 * @example usePromise('Execute order 66')
 *
 * @param promise the promise you want to handle synchronously
 */
export const usePromise = <T, E = unknown>(promise: T | Promise<T>): SyncPromise<T, E> => {
    const [syncPromise, setSyncPromise] = useState<SyncPromise<T, E>>(createPending());

    useEffect(() => {
        const stoppable = new Stoppable();

        const process = async (): Promise<void> => {
            let newSyncPromise: SyncPromise<T, E>;

            try {
                newSyncPromise = createResolved(await promise);
            } catch (e) {
                newSyncPromise = createRejected(e as E);
            } finally {
                stoppable.run(() => setSyncPromise(newSyncPromise));
            }
        };

        void process();

        return () => stoppable.stop();
    }, [promise]);

    return syncPromise;
};

/**
 * @example `isPending(usePromise(new Promise(() => void 0)))`
 */
export const isPending = <T, E = unknown>(promise: SyncPromise<T, E>): promise is PendingPromise => promise.state === SyncPromiseState.PENDING;

/**
 * @example `isResolved(usePromise(Promise.resolve('I have resolve')))`
 */
export const isResolved = <T, E = unknown>(promise: SyncPromise<T, E>): promise is ResolvedPromise<T> => promise.state === SyncPromiseState.RESOLVED;

/**
 * @example `isRejected(usePromise(Promise.reject('I have no resolve')))`
 */
export const isRejected = <T, E = unknown>(promise: SyncPromise<T, E>): promise is RejectedPromise<E> => promise.state === SyncPromiseState.REJECTED;

/**
 * @example `ifUnresolved(usePromise(Promise.reject('I have no resolve')), 'I am unresolved')`
 */
export const ifUnresolved = <T, E = unknown>(promise: SyncPromise<T, E>, otherwise: T): T => (isResolved(promise) ? promise.value : otherwise);
