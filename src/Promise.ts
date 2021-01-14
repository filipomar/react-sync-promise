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
type RejectedPromise = WithState<PromiseState.REJECTED> & WithValue<unknown>;

type WrappedPromise<T> = PendingPromise | ResolvedPromise<T> | RejectedPromise;

/**
 * Handle promises synchronously in react!
 *
 * @example usePromise(Promise.resolve('Execute order 66'))
 *
 * @param promise the promise you want to handle synchronously
 */
export const usePromise = <T>(promise: T | Promise<T>): WrappedPromise<T> => {
    const [value, setValue] = useReactState<WrappedPromise<T>>({ state: PromiseState.PENDING });

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
                newValue = { state: PromiseState.REJECTED, value: e };
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

export const isPending = <T>(promise: WrappedPromise<T>): promise is PendingPromise => promise.state === PromiseState.PENDING;

export const isResolved = <T>(content: WrappedPromise<T>): content is ResolvedPromise<T> => content.state === PromiseState.RESOLVED;

export const isRejected = <T>(content: WrappedPromise<T>): content is RejectedPromise => content.state === PromiseState.REJECTED;
