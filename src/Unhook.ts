import { useState, useEffect, Dispatch, SetStateAction, useCallback, useRef } from 'react';

/**
 * @description same behaviour as `useSate` but stops updates when unhooked
 * @see {useSate}
 */
export const useHookedState = <S>(initialState: S): [state: S, dispatcher: Dispatch<SetStateAction<S>>] => {
    const ref = useRef(true);

    const [state, dispatcher] = useState<S>(initialState);

    /**
     * Update when unhooked
     */
    useEffect(
        () => () => {
            ref.current = false;
        },
        [],
    );

    const hookedDispatcher: Dispatch<SetStateAction<S>> = useCallback(
        (...args) => {
            if (ref.current) {
                dispatcher(...args);
            }
        },
        [dispatcher, ref],
    );

    return [state, hookedDispatcher];
};
