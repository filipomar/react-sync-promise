import { useState as useReactState, useEffect } from 'react';

export enum PromiseState {
    PENDING = 'PENDING',
    RESOLVED = 'RESOLVED',
    REJECTED = 'REJECTED',
}

type WithState<S extends PromiseState> = { readonly state: S };
type WithValue<V> = { readonly value: V };

type PendingPromise = WithState<PromiseState.PENDING>;
type ResolvedPromise<T> = WithState<PromiseState.RESOLVED> & WithValue<T>;
type RejectedPromise<E> = WithState<PromiseState.REJECTED> & WithValue<E>;

type WrappedPromise<T, E> = PendingPromise | ResolvedPromise<T> | RejectedPromise<E>;

/**
 * Handle promises synchronously in react!
 *
 * @example usePromise(Promise.resolve('Execute order 66'))
 *
 * @param promise the promise you want to handle synchronously
 */
export const usePromise = <T, E = unknown>(promise: T | Promise<T>): WrappedPromise<T, E> => {
    const [value, setValue] = useReactState<WrappedPromise<T, E>>({ state: PromiseState.PENDING });

    useEffect(() => {
        /**
         * Aux flag to halt changes in case of internal hook has been unmounted
         */
        let alive = true;

        const process = async (): Promise<void> => {
            let newValue: typeof value;

            try {
                newValue = { state: PromiseState.RESOLVED, value: await promise };
            } catch (e) {
                newValue = { state: PromiseState.REJECTED, value: e as E };
            }

            if (alive) {
                /**
                 * If the hook has been dropped since the promise got resolved
                 */
                setValue(newValue);
            }
        };

        void process();

        return () => {
            alive = false;
        };
    }, [promise]);

    return value;
};

/**
 * @example `isPending(usePromise(new Promise(() => void 0)))`
 */
export const isPending = <T, E = unknown>(promise: WrappedPromise<T, E>): promise is PendingPromise => promise.state === PromiseState.PENDING;

/**
 * @example `isPending(usePromise(Promise.resolve('I have no resolve')))`
 */
export const isResolved = <T, E = unknown>(promise: WrappedPromise<T, E>): promise is ResolvedPromise<T> => promise.state === PromiseState.RESOLVED;

/**
 * @example `isPending(usePromise(Promise.reject('I have no resolve')))`
 */
export const isRejected = <T, E = unknown>(promise: WrappedPromise<T, E>): promise is RejectedPromise<E> => promise.state === PromiseState.REJECTED;

/**
 * @example `ifUnresolved(usePromise(Promise.reject('I have no resolve')), 'I am unresolved')`
 */
export const ifUnresolved = <T, E = unknown>(promise: WrappedPromise<T, E>, otherwise: T): T => (isResolved(promise) ? promise.value : otherwise);
