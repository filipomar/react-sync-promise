import { ifUnresolved, ifNotRejected, SyncPromiseState, isPending, isRejected, isResolved } from '.';

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
        expect(isPending({ state: SyncPromiseState.REJECTED, value: 'rejection' })).toBe(false);
        expect(isPending({ state: SyncPromiseState.RESOLVED, value: 'resolution' })).toBe(false);
    });
});

describe(isRejected, () => {
    it('isPending detects promises that are still loading', () => {
        expect(isRejected({ state: SyncPromiseState.PENDING })).toBe(false);
        expect(isRejected({ state: SyncPromiseState.REJECTED, value: 'rejection' })).toBe(true);
        expect(isRejected({ state: SyncPromiseState.RESOLVED, value: 'resolution' })).toBe(false);
    });
});

describe(isResolved, () => {
    it('isPending detects promises that are still loading', () => {
        expect(isResolved({ state: SyncPromiseState.PENDING })).toBe(false);
        expect(isResolved({ state: SyncPromiseState.REJECTED, value: 'rejection' })).toBe(false);
        expect(isResolved({ state: SyncPromiseState.RESOLVED, value: 'resolution' })).toBe(true);
    });
});
