/**
 * Simple utility to assist on unhook handling
 */
export class Stoppable {
    private stopped = false;

    stop(): void {
        this.stopped = true;
    }

    run(aliveCallback: () => void): void {
        if (!this.stopped) {
            aliveCallback();
        }
    }
}
