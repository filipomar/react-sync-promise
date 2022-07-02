import { useState, useEffect, useMemo, Dispatch, SetStateAction } from 'react';

import { PendingPromise, RejectedPromise, ResolvedPromise, SyncPromise, SyncPromiseState } from '.';

/**
 * @description same behaviour as `useSate` but stops updates when unhooked
 * @see {useSate}
 */
const useHookedState = <S>(initialState: S): [state: S, dispatcher: Dispatch<SetStateAction<S>>] => {
    const ref = useMemo(() => ({ hooked: true }), []);

    const [state, dispatcher] = useState<S>(initialState);

    useEffect(
        () => () => {
            ref.hooked = false;
        },
        [],
    );

    return [
        state,
        (...args) => {
            if (ref.hooked) {
                dispatcher(...args);
            }
        },
    ];
};

const initial: PendingPromise = { state: SyncPromiseState.PENDING };

/**
 * Handle promises synchronously in react!
 *
 * @example usePromise(Promise.resolve('Execute order 66'))
 * @example usePromise<string, Error>(Promise.resolve('Execute order 66'))
 *
 * @param asyncPromise the promise you want to handle synchronously
 */
export const usePromise = <T, E = unknown>(asyncPromise: T | Promise<T>): SyncPromise<T, E> => {
    const [promise, setPromise] = useHookedState<SyncPromise<T, E> | null>(null);

    useEffect(() => {
        /** Reset state */
        setPromise(null);

        const guarantiedPromise = asyncPromise instanceof Promise ? asyncPromise : Promise.resolve(asyncPromise);

        guarantiedPromise
            .then((value): ResolvedPromise<T> => ({ state: SyncPromiseState.RESOLVED, value }))
            .catch((value: E): RejectedPromise<E> => ({ state: SyncPromiseState.REJECTED, value }))
            /** Update state with result */
            .then((r) => setPromise(r));
    }, [asyncPromise]);

    return promise || initial;
};
