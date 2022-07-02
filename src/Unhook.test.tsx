import React, { Dispatch, FC, SetStateAction, useEffect, useState } from 'react';
import { fireEvent, render, act } from '@testing-library/react';

import { useHookedState } from './Unhook';

import { delay } from '../test';

type Dispatcher = Dispatch<SetStateAction<number>>;

const Internal: FC<{ onRender: (dispatcher: Dispatcher) => void }> = ({ onRender }) => {
    const [counter, setCounter] = useHookedState(0);

    useEffect(() => onRender(setCounter), []);

    return <span>{`Count ${counter}`}</span>;
};

const Helper: FC = ({ children }) => {
    const [show, setShow] = useState(true);

    return (
        <>
            <button type="button" aria-label="testing-button" onClick={() => setShow(!show)} />
            {show && children}
        </>
    );
};

describe(useHookedState, () => {
    it('only updates state if it is hooked', () => act(async () => {
        /** Hooks */
        const errorLog = jest.spyOn(console, 'error').mockReturnValue();

        const onRender = jest.fn<void, [Dispatcher]>();
        const { container } = render(
            <Helper>
                <Internal onRender={onRender} />
            </Helper>,
        );

        await delay(0);

        /** Everything is rendered */
        expect(onRender).toBeCalledTimes(1);
        expect(container.querySelector('span')?.textContent).toBe('Count 0');

        /** Change count */
        onRender.mock.calls[0][0](1);

        /** Value is updated */
        expect(container.querySelector('span')?.textContent).toBe('Count 1');

        /** Hide hook */
        const button = container.querySelector('button');
        if (!button) {
            throw new Error('Button not rendered');
        }
        fireEvent.click(button);

        /** Span is hidden */
        expect(container.querySelector('span')?.textContent).toBeUndefined();

        /** Change count again */
        onRender.mock.calls[0][0](2);

        /** React did NOT complained about anything as expected */
        expect(errorLog).toBeCalledTimes(0);
    }));
});
