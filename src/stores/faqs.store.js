// Imports => MOBX
import {observable, computed, makeObservable, action} from 'mobx';
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';

let app = {};

export class FaqsStore {
    constructor(store) {
        makeObservable(this);
        app.store = store;
    }

    @observable
    items = [];

    @observable
    loading = {
        status: false,
        message: undefined,
    };

    @computed
    get is_loading() {
        return this.loading.status;
    }

    @computed
    get all_faqs() {
        return this.items.map((item) => ({
            label: item.question,
            body: parse(DOMPurify.sanitize(item.answer)),
        }))
    }

    @action
    getAll = async () => {
        this.loading.status = true

        app.store.api.faqs.list()
            .then((response) => {
                this.items = response.data
            })
            .catch(e => console.error(e))
            .finally(() => {
                this.loading.status = false
            })
    }

}

export default FaqsStore;
