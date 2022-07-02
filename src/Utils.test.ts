import { ifUnresolved, ifNotRejected, SyncPromiseState, isPending } from '.';

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

describe(isPending, () => {
    it('isPending detects promises that are still loading', () => {
        expect(isPending({ state: SyncPromiseState.PENDING })).toBe(true);
    });
});
