# react-sync-promise

A short react helper snippet to handle promises as a react synchronous hook

## Usage

```tsx
import React, { FC } from 'react';
import { usePromise, isPending, isRejected, isResolved, ifUnresolved, ifNotRejected } from 'react-sync-promise';

export const PrequelsSurprise: FC = () => {
    const syncPromise = usePromise(Promise.resolve('Execute order 66'));

    return (
        <ul>
            <li>{`JSON: ${JSON.stringify(syncPromise)}`}</li>
            <li>{`isPending: ${String(isPending(syncPromise))}`}</li>
            <li>{`isRejected: ${String(isRejected(syncPromise))}`}</li>
            <li>{`isResolved: ${String(isResolved(syncPromise))}`}</li>
            <li>{`ifUnresolved: ${String(ifUnresolved(syncPromise, 'Hello There'))}`}</li>
            <li>{`ifNotRejected: ${String(ifNotRejected(syncPromise, 'General kenobi'))}`}</li>
        </ul>
    );
};
```

## License

APACHE
