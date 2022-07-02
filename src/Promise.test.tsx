import React, { FC, useState, PropsWithChildren } from 'react';
import { fireEvent, render, act } from '@testing-library/react';

import { usePromise, isPending, isRejected, isResolved, ifUnresolved, ifNotRejected, SyncPromiseState, SyncPromise } from '.';

type Args<T> = Readonly<{ promise?: Promise<T>; otherwise: T; onRender?: (asyncPromise: Promise<T> | undefined, syncPromise: SyncPromise<T | undefined, unknown>) => unknown }>;

const delay = async (milliseconds: number): Promise<void> => new Promise((resolve) => {
    setTimeout(() => resolve(), milliseconds);
});
const extractWrapper = (container: HTMLElement): string[] => Array.from(container.querySelectorAll('ul li')).map((el) => String(el.textContent));

const PromiseHookWrapper = <T = boolean, >({ promise, otherwise, onRender }: PropsWithChildren<Args<T>>): ReturnType<FC> => {
    const syncPromise = usePromise(promise);

    onRender?.(promise, syncPromise);

    return (
        <ul>
            <li>{`JSON: ${JSON.stringify(syncPromise)}`}</li>
            <li>{`isPending: ${String(isPending(syncPromise))}`}</li>
            <li>{`isRejected: ${String(isRejected(syncPromise))}`}</li>
            <li>{`isResolved: ${String(isResolved(syncPromise))}`}</li>
            <li>{`ifUnresolved: ${String(ifUnresolved(syncPromise, otherwise))}`}</li>
            <li>{`ifNotRejected: ${String(ifNotRejected(syncPromise, otherwise))}`}</li>
        </ul>
    );
};

const Helper: FC<Args<boolean>> = ({ promise }) => {
    const [show, setShow] = useState(true);

    return (
        <>
            <button type="button" aria-label="testing-button" onClick={() => setShow(!show)} />
            {show && <PromiseHookWrapper promise={promise} otherwise />}
        </>
    );
};

describe(ifUnresolved, () => {
    it('ifUnresolved detects unresolved promises and gives out alternative value', () => {
        expect(ifUnresolved({ state: SyncPromiseState.PENDING }, 'alternative')).toBe('alternative');
        expect(ifUnresolved({ state: SyncPromiseState.REJECTED, value: 'rejection' }, 'alternative')).toBe('alternative');
        expect(ifUnresolved({ state: SyncPromiseState.RESOLVED, value: 'resolution' }, 'alternative')).toBe('resolution');
    });
});

describe(ifNotRejected, () => {
    it('ifNotRejected detects non rejected promises and gives out alternative value', () => {
        expect(ifNotRejected({ state: SyncPromiseState.PENDING }, 'alternative')).toBe('alternative');
        expect(ifNotRejected({ state: SyncPromiseState.REJECTED, value: 'rejection' }, 'alternative')).toBe('rejection');
        expect(ifNotRejected({ state: SyncPromiseState.RESOLVED, value: 'resolution' }, 'alternative')).toBe('alternative');
    });
});

describe(usePromise, () => {
    it('validates that when a promise resolves, it causes the value to change', () => act(async () => {
        const errorLog = jest.spyOn(console, 'error').mockReturnValue();

        const promiseMock = jest.fn<void, [(value: boolean) => void, (rejection: unknown) => void]>();

        const { container } = render(<Helper promise={new Promise(promiseMock)} otherwise />);

        expect(extractWrapper(container)).toStrictEqual([
            'JSON: {"state":"PENDING"}',
            'isPending: true',
            'isRejected: false',
            'isResolved: false',

            // Even before it is unresolved, it still set to true
            'ifUnresolved: true',
            'ifNotRejected: true',
        ]);

        await delay(1);

        expect(promiseMock).toBeCalledTimes(1);
        /** Resolving */
        promiseMock.mock.calls[0][0](true);

        /** Giving react time to breathe */
        await delay(1);

        expect(extractWrapper(container)).toStrictEqual([
            'JSON: {"state":"RESOLVED","value":true}',
            'isPending: false',
            'isRejected: false',
            'isResolved: true',
            'ifUnresolved: true',
            'ifNotRejected: true',
        ]);

        /** React did NOT complained about anything */
        expect(errorLog).toBeCalledTimes(0);
    }));

    it('validates that when a promise resolves AFTER the component has been unmounted, an error does not occur', () => act(async () => {
        /** Hooks */
        const errorLog = jest.spyOn(console, 'error').mockReturnValue();

        const promiseMock = jest.fn<void, [(value: boolean) => void, (rejection: unknown) => void]>();
        const { container } = render(<Helper promise={new Promise(promiseMock)} otherwise />);

        /** Hide hook */
        const button = container.querySelector('button');
        if (!button) {
            throw new Error('Button not rendered');
        }
        fireEvent.click(button);

        await delay(1);

        /** No content is being rendered */
        expect(container.innerText).toBeUndefined();

        /** Resolve after it was hidden */
        expect(promiseMock).toBeCalledTimes(1);
        promiseMock.mock.calls[0][0](true);

        await delay(1);

        expect(extractWrapper(container)).toStrictEqual([]);

        /** React did NOT complained about anything */
        expect(errorLog).toBeCalledTimes(0);
    }));

    it('handles rejections and fallbacks', () => act(async () => {
        const errorLog = jest.spyOn(console, 'error').mockReturnValue();

        const promiseMock = jest.fn<void, [(value: boolean) => void, (rejection: unknown) => void]>();

        const { container } = render(<Helper promise={new Promise(promiseMock)} otherwise />);

        expect(extractWrapper(container)).toStrictEqual([
            'JSON: {"state":"PENDING"}',
            'isPending: true',
            'isRejected: false',
            'isResolved: false',

            // Fallback
            'ifUnresolved: true',
            'ifNotRejected: true',
        ]);

        await delay(1);

        expect(promiseMock).toBeCalledTimes(1);
        /** Rejecting */
        promiseMock.mock.calls[0][1]('Ew');

        /** Giving react time to breathe */
        await delay(1);

        expect(extractWrapper(container)).toStrictEqual([
            'JSON: {"state":"REJECTED","value":"Ew"}',
            'isPending: false',
            'isRejected: true',
            'isResolved: false',

            // Fallback
            'ifUnresolved: true',
            'ifNotRejected: Ew',
        ]);

        /** React did NOT complained about anything */
        expect(errorLog).toBeCalledTimes(0);
    }));

    it('will accept no value', () => act(async () => {
        const errorLog = jest.spyOn(console, 'error').mockReturnValue();

        const { container } = render(<Helper otherwise />);
        await delay(1);

        expect(extractWrapper(container)).toStrictEqual([
            'JSON: {"state":"RESOLVED"}',
            'isPending: false',
            'isRejected: false',
            'isResolved: true',
            // Fallbacks to the value, that is undefined
            'ifUnresolved: undefined',
            'ifNotRejected: true',
        ]);

        /** React did NOT complained about anything */
        expect(errorLog).toBeCalledTimes(0);
    }));

    it('resets the promise before updating the sync promise value', () => act(async () => {
        const errorLog = jest.spyOn(console, 'error').mockReturnValue();

        const onRender = jest.fn();

        const promiseA = delay(100).then(() => 'A');
        const promiseB = delay(200).then(() => 'B');

        const Switcher: FC = () => {
            const [promise, setPromise] = useState(promiseA);

            return (
                <>
                    <button type="button" aria-label="testing-button" onClick={() => setPromise(promiseB)} />
                    <PromiseHookWrapper promise={promise} otherwise="C" onRender={onRender} />
                </>
            );
        };

        const { container, unmount } = render(<Switcher />);

        await delay(50);

        /** Had only first render, the initial state */
        expect(onRender).toBeCalledTimes(1);
        expect(onRender).nthCalledWith(1, promiseA, { state: SyncPromiseState.PENDING });
        expect(extractWrapper(container)).toStrictEqual([
            'JSON: {"state":"PENDING"}',
            'isPending: true',
            'isRejected: false',
            'isResolved: false',
            'ifUnresolved: C',
            'ifNotRejected: C',
        ]);

        await delay(50);

        /** Now it has loaded, second re-render with the resolution */
        expect(onRender).toBeCalledTimes(2);
        expect(onRender).nthCalledWith(2, promiseA, { state: SyncPromiseState.RESOLVED, value: 'A' });
        expect(extractWrapper(container)).toStrictEqual([
            'JSON: {"state":"RESOLVED","value":"A"}',
            'isPending: false',
            'isRejected: false',
            'isResolved: true',
            'ifUnresolved: A',
            'ifNotRejected: C',
        ]);

        /** Switch to second promise */
        const button = container.querySelector('button');
        if (!button) {
            throw new Error('Button not rendered');
        }
        fireEvent.click(button);

        await delay(1);

        /** Now on fourth render, as it is has recieved the original async promise and was internally set to pending again */
        expect(onRender).toBeCalledTimes(4);
        expect(onRender).nthCalledWith(3, promiseB, { state: SyncPromiseState.RESOLVED, value: 'A' });
        expect(onRender).nthCalledWith(4, promiseB, { state: SyncPromiseState.PENDING });
        expect(extractWrapper(container)).toStrictEqual([
            'JSON: {"state":"PENDING"}',
            'isPending: true',
            'isRejected: false',
            'isResolved: false',
            'ifUnresolved: C',
            'ifNotRejected: C',
        ]);

        await delay(100);

        /** Now on the fifth render with the new inbound sync promise */
        expect(onRender).toBeCalledTimes(5);
        expect(onRender).nthCalledWith(5, promiseB, { state: SyncPromiseState.RESOLVED, value: 'B' });
        expect(extractWrapper(container)).toStrictEqual([
            'JSON: {"state":"RESOLVED","value":"B"}',
            'isPending: false',
            'isRejected: false',
            'isResolved: true',
            'ifUnresolved: B',
            'ifNotRejected: C',
        ]);

        unmount();

        /** React did NOT complained about anything */
        expect(errorLog).toBeCalledTimes(0);
    }));
});
