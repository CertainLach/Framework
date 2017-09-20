import {action, observable, unboundAction, observe} from './mobx';
import {autobind} from './reactTools';

export class RouterStore {
    @observable location = null;

    history = null;

    constructor() {}

    @unboundAction
    _updateLocation(newState) {
        this.location = newState;
    }

    @autobind
    push(location) {
        this.history.push(location);
    }
    @autobind
    replace(location) {
        this.history.replace(location);
    }
    @autobind
    go(n) {
        this.history.go(n);
    }
    @autobind
    goBack() {
        this.history.goBack();
    }
    @autobind
    goForward() {
        this.history.goForward();
    }
}

export const syncHistoryWithStore = (history, store) => {
    // Initialise store
    store.history = history;

    // Handle update from history object
    const handleLocationChange = (location) => {
        store._updateLocation(location);
    };

    const unsubscribeFromHistory = history.listen(handleLocationChange);
    handleLocationChange(history.getCurrentLocation());

    return {
        ...history,
        // User can subscribe to history changes
        listen(listener) {
            const onStoreChange = (change) => {
                listener(store.location);
            };

            // Listen for changes to location state in store
            const unsubscribeFromStore = observe(store, 'location', onStoreChange);

            listener(store.location);

            return () => {
                unsubscribeFromStore();
            };
        },

        // Provide way to unsubscribe from history
        unsubscribe() {
            unsubscribeFromHistory();
        }
    };
};