# react-sync-promise
A short react helper snippet to handle promises as a react synchronous hook<br />

## Usage

```tsx
import React from 'react';
import { usePromise, isPending, isRejected, isResolved } from 'react-sync-promise';

export const PrequelsSurprise: FC = () => {
    const syncPromise = usePromise(Promise.resolve('Execute order 66'));

    return (
        <ul>
            <li>JSON: {JSON.stringify(syncPromise)}</li>
            <li>isPending: {String(isPending(syncPromise))}</li>
            <li>isRejected: {String(isRejected(syncPromise))}</li>
            <li>isResolved: {String(isResolved(syncPromise))}</li>
        </ul>
    );
};
```
