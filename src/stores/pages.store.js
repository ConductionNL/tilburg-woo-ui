// Imports => MOBX
import { observable, computed, makeObservable, action, toJS } from 'mobx';
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';

let app = {};

export class PagesStore {
    constructor(store) {
        makeObservable(this);
        app.store = store;
    }

    @observable
    items = [];

    @observable
    single = {};

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
    get all_pages() {
        return this.items ? toJS(this.items) : [];
    }

    @computed
    get get_single() {
        return this.single ? toJS(this.single) : null;
    }

    @action
    resetPage = () => {
        this.single = {};
    };

    @action
    fetchPage = async (id) => {
        this.loading.status = true;

        app.store.api.pages
            .single(id)
            .then((response) => {
                this.single = response.data;
            })
            .catch((e) => console.error(e))
            .finally(() => {
                this.loading.status = false;
            });
    };

    @action
    fetchPages = async () => {
        this.loading.status = true;

        app.store.api.pages
            .list()
            .then((response) => {
                this.items = response.data;
            })
            .catch((e) => console.error(e))
            .finally(() => {
                this.loading.status = false;
            });
    };
}

export default PagesStore;
