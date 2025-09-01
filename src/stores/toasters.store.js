// Imports => MOBX
import {
  makeObservable,
  observable,
  computed,
  action,
  toJS,
  runInAction,
} from 'mobx';

// Imports => Constants
import { KEYS } from '@constants';

// Imports => Utilities
import { AcUUID, AcIsSet, AcIsUndefined, AcSaveState } from '@utils';

let app = {};

export class ToastersStore {
  constructor(store) {
    makeObservable(this);

    app.store = store;
  }

  @observable
  collection = [];

  @computed
  get queue() {
    return toJS(this.collection || []);
  }

  @action
  add = (options) => {
    return new Promise((resolve) => {
      /*
                New Toaster config:
                options: {
                    variant: <string>,
                    title: <string>,
                    description: <string>,
                    delay: <int>,
                }
            */

      const time = new Date().getTime();
      const delay = options.delay ? options.delay : 1000 * 5;
      const expires = time + delay;

      const toast = {
        ...options,
        id: AcUUID(),
        delay,
        time,
        expires,
      };

      // this.clear_queue();

      const collection = this.queue !== null ? this.queue : [];
      collection.push(toast);
      this.collection = collection;

      resolve(toast);
      return toast;
    });
  };

  @action
  update = (id, options) => {
    const collection = this.queue.slice();
    const len = collection.length;
    let n = 0;
    let result = collection;
    let found = null;
    let index = null;

    for (n; n < len; n++) {
      const item = collection[n];

      if (item.id === id) {
        found = item;
        index = n;
        break;
      }
    }

    if (found) {
      const time = new Date().getTime();
      const delay = options.delay ? options.delay : 1000 * 5;
      const expires = time + delay;

      found = {
        ...found,
        ...options,
        delay,
        time,
        expires,
      };

      collection[index] = found;

      runInAction(() => {
        this.set(KEYS.COLLECTION, collection);
      });
    }
  };

  @action
  clear_queue = () => {
    runInAction(() => {
      return this.set(KEYS.COLLECTION, []);
    });
  };

  @action
  remove = (id) => {
    const collection = this.queue !== null ? this.queue : [];
    let new_collection = [];

    if (!AcIsSet(id)) {
      new_collection = collection.shift();
    } else {
      new_collection = collection.filter((item) => {
        return item.id !== id;
      });
    }

    runInAction(() => {
      this.set(KEYS.COLLECTION, new_collection);
    });
  };

  @action
  set = (target, value) => {
    if (!AcIsSet(target)) return;
    if (AcIsUndefined(this[target])) return;
    if (AcIsUndefined(value)) return;

    return new Promise((resolve) => {
      runInAction(() => {
        this[target] = value;
        resolve();
      });
    });
  };
}

export default ToastersStore;
