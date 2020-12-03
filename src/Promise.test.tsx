import React, { FC, useState } from 'react';
import { fireEvent, render, act } from '@testing-library/react';

import { usePromise, isPending, isRejected, isResolved } from '.';

type Args = { readonly promise?: Promise<boolean> };

const delay = async (milliseconds: number): Promise<void> => new Promise((resolve) => setTimeout(() => resolve(), milliseconds));
const extractWrapper = (container: HTMLElement): string[] => Array.from(container.querySelectorAll('ul li')).map((el) => String(el.textContent));

const PromiseHookWrapper: FC<Args> = ({ promise }) => {
    const syncPromise = usePromise(promise);

    return (
        <ul>
            <li>JSON: {JSON.stringify(syncPromise)}</li>
            <li>isPending: {String(isPending(syncPromise))}</li>
            <li>isRejected: {String(isRejected(syncPromise))}</li>
            <li>isResolved: {String(isResolved(syncPromise))}</li>
        </ul>
    );
};

const Helper: FC<Args> = ({ promise }) => {
    const [show, setShow] = useState(true);

    return (
        <>
            <button onClick={() => setShow(!show)} />
            {show && <PromiseHookWrapper promise={promise} />}
        </>
    );
};

beforeEach(() => jest.resetAllMocks());

describe('usePromise', () => {
    it('validates that when a promise resolves, it causes the value to change', () =>
        act(async () => {
            const errorLog = jest.fn();
            console.error = errorLog;

            const promiseMock = jest.fn<void, [(value: boolean) => void, (rejection: unknown) => void]>();

            const { container } = render(<Helper promise={new Promise(promiseMock)} />);

            await delay(1);

            expect(promiseMock).toBeCalledTimes(1);
            /**
             * Resolving
             */
            promiseMock.mock.calls[0][0](true);

            /**
             * Giving react time to breathe
             */
            await delay(1);

            expect(extractWrapper(container)).toStrictEqual(['JSON: {"state":"RESOLVED","value":true}', 'isPending: false', 'isRejected: false', 'isResolved: true']);

            /**
             * React did NOT complained about anything
             */
            expect(errorLog).toBeCalledTimes(0);
        }));

    it('validates that when a promise resolves AFTER the component has been unmounted, an error does not occur', () =>
        act(async () => {
            /**
             * Hooks
             */
            const errorLog = jest.fn();
            console.error = errorLog;

            const promiseMock = jest.fn<void, [(value: boolean) => void, (rejection: unknown) => void]>();
            const { container } = render(<Helper promise={new Promise(promiseMock)} />);

            /**
             * Hide hook
             */
            const button = container.querySelector('button');
            if (!button) {
                fail('Button not rendered');
            }
            fireEvent.click(button);

            await delay(1);

            /**
             * No content is being rendered
             */
            expect(container.innerText).toBeUndefined();

            /**
             * Resolve after it was hidden
             */
            expect(promiseMock).toBeCalledTimes(1);
            promiseMock.mock.calls[0][0](true);

            await delay(1);

            expect(extractWrapper(container)).toStrictEqual([]);

            /**
             * React did NOT complained about anything
             */
            expect(errorLog).toBeCalledTimes(0);
        }));

    it('handles rejections', () =>
        act(async () => {
            const errorLog = jest.fn();
            console.error = errorLog;

            const promiseMock = jest.fn<void, [(value: boolean) => void, (rejection: unknown) => void]>();

            const { container } = render(<Helper promise={new Promise(promiseMock)} />);

            await delay(1);

            expect(promiseMock).toBeCalledTimes(1);
            /**
             * Rejecting
             */
            promiseMock.mock.calls[0][1]('Ew');

            /**
             * Giving react time to breathe
             */
            await delay(1);

            expect(extractWrapper(container)).toStrictEqual(['JSON: {"state":"REJECTED","value":"Ew"}', 'isPending: false', 'isRejected: true', 'isResolved: false']);

            /**
             * React did NOT complained about anything
             */
            expect(errorLog).toBeCalledTimes(0);
        }));

    it('will accept no value', () =>
        act(async () => {
            const errorLog = jest.fn();
            console.error = errorLog;

            const { container } = render(<Helper />);
            await delay(1);

            expect(extractWrapper(container)).toStrictEqual(['JSON: {"state":"RESOLVED"}', 'isPending: false', 'isRejected: false', 'isResolved: true']);

            /**
             * React did NOT complained about anything
             */
            expect(errorLog).toBeCalledTimes(0);
        }));
});
