import { useState, useEffect, useMemo, Dispatch, SetStateAction, useCallback } from 'react';

/**
 * @description same behaviour as `useSate` but stops updates when unhooked
 * @see {useSate}
 */
export const useHookedState = <S>(initialState: S): [state: S, dispatcher: Dispatch<SetStateAction<S>>] => {
    const ref = useMemo(() => ({ hooked: true }), []);

    const [state, dispatcher] = useState<S>(initialState);

    /**
     * Update when unhooked
     */
    useEffect(
        () => () => {
            ref.hooked = false;
        },
        [],
    );

    const hookedDispatcher: Dispatch<SetStateAction<S>> = useCallback(
        (...args) => {
            if (ref.hooked) {
                dispatcher(...args);
            }
        },
        [dispatcher, ref],
    );

    return [state, hookedDispatcher];
};
