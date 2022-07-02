import { useEffect, Dispatch, SetStateAction, useCallback, useMemo } from 'react';

import { PendingPromise, RejectedPromise, ResolvedPromise, SyncPromise, SyncPromiseState } from '.';
import { useHookedState } from './Unhook';

type SourceRef<T> = { source: T | Promise<T> };

/**
 * Loads
 */
const loadPromise = <T, E>(newSource: T | Promise<T>, ref: SourceRef<T>, setSyncPromise: Dispatch<SyncPromise<T, E>>): void => {
    Promise.resolve(newSource)
        .then((value): ResolvedPromise<T> => ({ state: SyncPromiseState.RESOLVED, value }))
        .catch((value: E): RejectedPromise<E> => ({ state: SyncPromiseState.REJECTED, value }))
        /**
         * Update state with result if the response came from
         * the same source as the one that is currently loaded
         */
        .then((newDerived) => {
            if (ref.source === newSource) {
                setSyncPromise(newDerived);
            }
        });
};

/** All promises that are loading will point to this single object, which causes less re-renders */
const defaultSync: PendingPromise = { state: SyncPromiseState.PENDING };

/**
 * Handle promises synchronously in react!
 *
 * @example
 * const [promise, setPromise] = usePromiseState(Promise.resolve('Execute order 66'));
 * setPromise(Promise.resolve('Do, do not, there is no try'));
 * @example
 * const [promise, setPromise] = usePromiseState(Promise.resolve('There are decades when nothing happens'));
 * setPromise<string, Error>(Promise.resolve('there are weeks, where decades happen'));
 *
 * @param asyncPromise the promise you want to handle synchronously, don't forget to memoize it :)
 *
 * @returns a tupple capable of updating itself based on Promises on the react life-cycle generating react hooked objects
 */
export const usePromiseState = <T, E = unknown>(asyncPromise: T | Promise<T>): [syncPromise: SyncPromise<T, E>, dispatcher: Dispatch<SetStateAction<T | Promise<T>>>] => {
    /** A reference to the original promise, that will never be updated */
    const originalPromiseRef = useMemo<SourceRef<T>>(() => ({ source: asyncPromise }), []);

    /** The derived sync promise */
    const [syncPromise, setSyncPromise] = useHookedState<SyncPromise<T, E> | null>(null);

    const callback = useCallback(
        (action: SetStateAction<T | Promise<T>>) => {
            const newSource = action instanceof Function ? action(originalPromiseRef.source) : action;

            if (newSource === originalPromiseRef.source) {
                /** Source is already loaded, do nothing */
                return;
            }

            /** Point the ref to the new source */
            originalPromiseRef.source = newSource;

            /** Mark it as loading again */
            setSyncPromise(null);

            /** Schedule promise to load */
            loadPromise(newSource, originalPromiseRef, setSyncPromise);
        },
        [originalPromiseRef],
    );

    /** Force initial load */
    useEffect(() => loadPromise(originalPromiseRef.source, originalPromiseRef, setSyncPromise), [originalPromiseRef]);

    return [syncPromise || defaultSync, callback];
};

/**
 * Handle promises synchronously in react!
 *
 * @example usePromise(Promise.resolve('Execute order 66'))
 * @example usePromise<string, Error>(Promise.resolve('Execute order 66'))
 *
 * @param asyncPromise the promise you want to handle synchronously, don't forget to memoize it :)
 */
export const usePromise = <T, E = unknown>(asyncPromise: T | Promise<T>): SyncPromise<T, E> => {
    const [promise, updateSourcePromise] = usePromiseState<T, E>(asyncPromise);

    /** If the promise changes, then update it accordingly */
    useEffect(() => updateSourcePromise(asyncPromise), [asyncPromise, updateSourcePromise]);

    return promise;
};
