import { useState, useEffect } from 'react';

export enum SyncPromiseState {
    PENDING = 'PENDING',
    RESOLVED = 'RESOLVED',
    REJECTED = 'REJECTED',
}

type WithState<S extends SyncPromiseState> = Readonly<{ state: S }>;
type WithValue<V> = Readonly<{ value: V }>;

type PendingPromise = WithState<SyncPromiseState.PENDING>;
type ResolvedPromise<T> = WithState<SyncPromiseState.RESOLVED> & WithValue<T>;
type RejectedPromise<E> = WithState<SyncPromiseState.REJECTED> & WithValue<E>;

/**
 * Synchronous promise hook result
 *
 * Use helper functions to infer actual type or play around with the state enum if you are stubborn
 */
export type SyncPromise<T, E> = PendingPromise | ResolvedPromise<T> | RejectedPromise<E>;

/**
 * Handle promises synchronously in react!
 *
 * @example usePromise(Promise.resolve('Execute order 66'))
 * @example usePromise<string, Error>(Promise.resolve('Execute order 66'))
 *
 * @param promise the promise you want to handle synchronously
 */
export const usePromise = <T, E = unknown>(promise: T | Promise<T>): SyncPromise<T, E> => {
    const [value, setValue] = useState<SyncPromise<T, E>>({ state: SyncPromiseState.PENDING });

    useEffect(() => {
        /**
         * Change halter for already discarded hook calls
         */
        let alive = true;

        const process = async (): Promise<void> => {
            let newValue: typeof value;

            try {
                newValue = { state: SyncPromiseState.RESOLVED, value: await promise };
            } catch (e) {
                newValue = { state: SyncPromiseState.REJECTED, value: e as E };
            }

            /**
             * Check if the hook has been dropped since the promise got resolved
             */
            if (alive) {
                setValue(newValue);
            }
        };

        process();

        return () => {
            alive = false;
        };
    }, [promise]);

    return value;
};

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
