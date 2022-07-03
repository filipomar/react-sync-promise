import React, { FC, useMemo, useState } from 'react';
import { fireEvent, render, act } from '@testing-library/react';

import { usePromise, SyncPromiseState, usePromiseState, SyncPromise } from '.';

import { delay } from '../test';

describe(usePromise, () => {
    it('validates that when a promise resolves AFTER the component has been unmounted, an error does not occur', () => act(async () => {
        const errorLog = jest.spyOn(console, 'error').mockReturnValue();

        const Label: FC<{ promise: Promise<unknown> }> = ({ promise }) => {
            const syncPromise = usePromise(promise);
            return <span>{JSON.stringify(syncPromise)}</span>;
        };

        const delayed = delay(100);

        const { unmount } = render(<Label promise={delayed.then(() => Promise.resolve('I am late'))} />);

        /** Unmount the component before the promise is resolved */
        await delay(50);
        unmount();

        /** Wait for the promise to resolve */
        await delayed.then(() => delay(1));

        /** React did NOT complained about anything */
        expect(errorLog).toBeCalledTimes(0);
    }));

    it('handles rejections and displays rejected promise', () => act(async () => {
        const errorLog = jest.spyOn(console, 'error').mockReturnValue();

        const Error: FC<{ promise: Promise<unknown> }> = ({ promise }) => {
            const syncPromise = usePromise(promise);
            return <span>{JSON.stringify(syncPromise)}</span>;
        };

        const delayed = delay(100);

        const { container, unmount } = render(<Error promise={delayed.then(() => Promise.reject('I am rejection'))} />);

        await delayed.then(() => delay(1));

        /** Error is displayed */
        expect(container.querySelector('span')?.textContent).toStrictEqual(JSON.stringify({ state: SyncPromiseState.REJECTED, value: 'I am rejection' }));

        unmount();

        /** React did NOT complained about anything */
        expect(errorLog).toBeCalledTimes(0);
    }));

    it('will accept non promise values', () => act(async () => {
        const errorLog = jest.spyOn(console, 'error').mockReturnValue();

        const NoValue: FC = () => {
            const promise = usePromise('I am not a promise');
            return <span>{JSON.stringify(promise)}</span>;
        };

        const { container } = render(<NoValue />);
        await delay(1);

        expect(container.querySelector('span')?.textContent).toStrictEqual(JSON.stringify({ state: SyncPromiseState.RESOLVED, value: 'I am not a promise' }));

        /** React did NOT complained about anything */
        expect(errorLog).toBeCalledTimes(0);
    }));

    it('resets the promise before updating the synchronous promise value', () => act(async () => {
        const errorLog = jest.spyOn(console, 'error').mockReturnValue();

        const promiseA = delay(100).then(() => 'A');
        const promiseB = delay(200).then(() => 'B');

        const Switcher: FC = () => {
            const [promise, setPromise] = useState(promiseA);
            const syncPromise = usePromise(promise);

            return (
                <>
                    <button type="button" aria-label="testing-button" onClick={() => setPromise(promiseB)} />
                    <span>{JSON.stringify(syncPromise)}</span>
                </>
            );
        };

        const { container, unmount } = render(<Switcher />);

        await delay(50);

        /** Render as loading */
        expect(container.querySelector('span')?.textContent).toStrictEqual(JSON.stringify({ state: SyncPromiseState.PENDING }));

        /** Await for A to render */
        await promiseA.then(() => delay(1));

        /** Render as loaded */
        expect(container.querySelector('span')?.textContent).toStrictEqual(JSON.stringify({ state: SyncPromiseState.RESOLVED, value: 'A' }));

        /** Switch to second promise */
        const button = container.querySelector('button');
        if (!button) {
            throw new Error('Button not rendered');
        }
        fireEvent.click(button);

        /** Await another cycle to render */
        await delay(1);

        /** The state is now loading again */
        expect(container.querySelector('span')?.textContent).toStrictEqual(JSON.stringify({ state: SyncPromiseState.PENDING }));

        /** Await for B to render */
        await promiseB.then(() => delay(1));

        /** Render as loaded again */
        expect(container.querySelector('span')?.textContent).toStrictEqual(JSON.stringify({ state: SyncPromiseState.RESOLVED, value: 'B' }));

        unmount();

        /** React did NOT complained about anything */
        expect(errorLog).toBeCalledTimes(0);
    }));
});

describe(usePromiseState, () => {
    it('ignores updates that have been overshadowed by other updates', () => act(async () => {
        const errorLog = jest.spyOn(console, 'error').mockReturnValue();

        const onRender = jest.fn<void, [SyncPromise<unknown, unknown>]>();

        const promiseA = delay(200).then(() => 'A');
        const promiseB = delay(100).then(() => 'B');

        const Switcher: FC = () => {
            const [promise, setPromise] = usePromiseState(promiseA);

            onRender(promise);

            return <button type="button" aria-label="testing-button" onClick={() => setPromise(promiseB)} />;
        };

        const { container, unmount } = render(<Switcher />);

        await delay(50);

        /** Loading A */
        expect(onRender).toBeCalledTimes(1);
        expect(onRender).nthCalledWith(1, { state: SyncPromiseState.PENDING });

        /** Switch to b promise */
        const button = container.querySelector('button');
        if (!button) {
            throw new Error('Button not rendered');
        }
        fireEvent.click(button);

        await delay(1);

        /** Await for b to render */
        await promiseB.then(() => delay(1));

        /** B is rendered */
        expect(onRender).toBeCalledTimes(2);
        expect(onRender).nthCalledWith(2, { state: SyncPromiseState.RESOLVED, value: 'B' });

        /** Await for the final render */
        await promiseA.then(() => delay(1));

        /** A resolution was not sent to cause another render */
        expect(onRender).toBeCalledTimes(2);

        unmount();

        /** React did NOT complained about anything */
        expect(errorLog).toBeCalledTimes(0);
    }));

    it('ignores updates set to the same promise', () => act(async () => {
        const errorLog = jest.spyOn(console, 'error').mockReturnValue();

        const onRender = jest.fn<void, [SyncPromise<unknown, unknown>]>();

        const onlyPromise = Promise.resolve('A');

        const Switcher: FC = () => {
            const [promise, setPromise] = usePromiseState(onlyPromise);

            onRender(promise);

            return <button type="button" aria-label="testing-button" onClick={() => setPromise(onlyPromise)} />;
        };

        const { container, unmount } = render(<Switcher />);

        /** Await for promise to be done */
        await onlyPromise.then(() => delay(1));

        expect(onRender).toBeCalledTimes(2);
        expect(onRender).nthCalledWith(1, { state: SyncPromiseState.PENDING });
        expect(onRender).nthCalledWith(2, { state: SyncPromiseState.RESOLVED, value: 'A' });

        /** Reload same promise */
        const button = container.querySelector('button');
        if (!button) {
            throw new Error('Button not rendered');
        }
        fireEvent.click(button);

        await delay(1);

        /** No more re-renders */
        expect(onRender).toBeCalledTimes(2);

        unmount();

        /** React did NOT complained about anything */
        expect(errorLog).toBeCalledTimes(0);
    }));

    it('allows update of promise as react Dispatcher', () => act(async () => {
        const errorLog = jest.spyOn(console, 'error').mockReturnValue();

        const firstPromise = Promise.resolve('A');
        const secondPromise = Promise.resolve('A');

        const onRender = jest.fn<void, [SyncPromise<unknown, unknown>]>();
        const switcher = jest
            .fn<Promise<string> | string, [Promise<string> | string]>()
            .mockImplementationOnce((p) => {
                expect(p === firstPromise).toBe(true);
                return p;
            })
            .mockImplementationOnce((p) => {
                expect(p === firstPromise).toBe(true);
                return secondPromise;
            });

        const Switcher: FC = () => {
            const [promise, setPromise] = usePromiseState(useMemo(() => firstPromise, []));

            onRender(promise);

            return <button type="button" aria-label="testing-button" onClick={() => setPromise((p) => switcher(p))} />;
        };

        const { container, unmount } = render(<Switcher />);

        await delay(1);

        expect(onRender).toBeCalledTimes(2);
        expect(onRender).nthCalledWith(1, { state: SyncPromiseState.PENDING });
        expect(onRender).nthCalledWith(2, { state: SyncPromiseState.RESOLVED, value: 'A' });

        /** Reload same promise */
        const button = container.querySelector('button');
        if (!button) {
            throw new Error('Button not rendered');
        }
        fireEvent.click(button);

        await delay(1);

        /** No more re-renders */
        expect(onRender).toBeCalledTimes(2);

        /** Switch to new promise with same yield */
        fireEvent.click(button);

        await delay(1);

        expect(onRender).toBeCalledTimes(4);
        expect(onRender).nthCalledWith(3, { state: SyncPromiseState.PENDING });
        expect(onRender).nthCalledWith(4, { state: SyncPromiseState.RESOLVED, value: 'A' });

        unmount();

        /** React did NOT complained about anything */
        expect(errorLog).toBeCalledTimes(0);
    }));
});
