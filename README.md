# react-sync-promise

A simple react helper snippet to handle promises as a react synchronous hook with mininmal amount of re-renders

## Usage

```tsx
import React, { FC, useMemo } from 'react';
import { usePromise, isPending, isRejected, isResolved, ifUnresolved, ifNotRejected, usePromiseState } from 'react-sync-promise';

export const PrequelsSurprise: FC = () => {
    const memoizedPromise = useMemo(() => Promise.resolve('Execute order 66'), []);

    const syncPromise = usePromise(memoizedPromise);
    const [secondSyncPromise, setSecondSyncPromise] = usePromiseState(memoizedPromise);

    return (
        <>
            <p>
                {`JSON: ${JSON.stringify(secondSyncPromise)}`}
                <button type="button" aria-label="Update Promise" onClick={() => setSecondSyncPromise(Promise.resolve('This is where the fun begins'))} />
            </p>
            <p>{`JSON: ${JSON.stringify(syncPromise)}`}</p>
            <p>{`isPending: ${String(isPending(syncPromise))}`}</p>
            <p>{`isRejected: ${String(isRejected(syncPromise))}`}</p>
            <p>{`isResolved: ${String(isResolved(syncPromise))}`}</p>
            <p>{`ifUnresolved: ${String(ifUnresolved(syncPromise, 'Hello There'))}`}</p>
            <p>{`ifNotRejected: ${String(ifNotRejected(syncPromise, 'General kenobi'))}`}</p>
        </>
    );
};
```

## License

APACHE
