import {AutocompleteResult} from "autocompleter/autocomplete";
import autocomplete, {AutocompleteItem} from "autocompleter";

type FetcherType<T> = (text: string) => Promise<T[]>;
type OnRenderCallbackType<T> = (element: HTMLDivElement, item: T, currentValue: string) => HTMLDivElement;
type OnSelectCallbackType<T> = (item: T) => void;
type ValueExtractorType<T> = (item: T) => string;

export class Autocompleter<T> {
    private readonly input: HTMLInputElement;

    private className: string = 'autocomplete-widget';
    private minLength: number = 2;
    private emptyMsg: string = 'No matches found';
    private debounceWaitMs?: number = 1000;
    private readonly preventSubmit: boolean = true;
    private readonly disableAutoSelect: boolean = true;
    private strictValue: boolean = true;

    private fetcher?: FetcherType<T>;
    private onRenderCallbacks: OnRenderCallbackType<T>[] = [];
    private onSelectCallbacks: OnSelectCallbackType<T>[] = [];
    private valueExtractor: ValueExtractorType<T>;

    private selectedItem?: T;

    constructor(input: HTMLInputElement, valueExtractor: ValueExtractorType<T>) {
        this.input = input;
        this.valueExtractor = valueExtractor;

        this.input.setAttribute('autocomplete', 'off');
        this.input.addEventListener('change', () => {
            const selectedValue = this.selectedItem ?
                this.valueExtractor(this.selectedItem)
                : '';

            if (selectedValue === this.input.value) {
                return;
            }

            if (this.strictValue) {
                this.reset();
            }
        });
    }

    public setClassName(className: string): this {
        this.className = className;
        return this;
    }

    public setMinLength(minLength: number): this {
        this.minLength = minLength;
        return this;
    }

    public setEmptyMsg(emptyMsg: string): this {
        this.emptyMsg = emptyMsg;
        return this;
    }

    public setDebounceWaitMs(debounceWaitMs: number): this {
        this.debounceWaitMs = debounceWaitMs;
        return this;
    }

    public setStrictValue(strictValue: boolean): this {
        this.strictValue = strictValue;
        return this;
    }

    public setFetcher(fetcher: FetcherType<T>): this {
        this.fetcher = fetcher;
        return this;
    }

    public onRender(callback: OnRenderCallbackType<T>): this {
        this.onRenderCallbacks.push(callback);
        return this;
    }

    public onSelect(callback: OnSelectCallbackType<T>): this {
        this.onSelectCallbacks.push(callback);
        return this;
    }

    public setValueExtractor(valueExtractor: ValueExtractorType<T>): this {
        this.valueExtractor = valueExtractor;
        return this;
    }

    public getSelectedItem(): T|undefined {
        return this.selectedItem;
    }

    public reset(): void {
        this.selectedItem = undefined;
        this.input.value = '';
        delete this.input.dataset.autocompleteItem;
    }

    public create(): AutocompleteResult {
        const self = this;

        return autocomplete<AutocompleteItem & T>({
            input: self.input,
            emptyMsg: self.emptyMsg,
            minLength: self.minLength,
            className: self.className,
            debounceWaitMs: self.debounceWaitMs,
            preventSubmit: self.preventSubmit,
            disableAutoSelect: self.disableAutoSelect,

            fetch(
                text: string,
                update: (items: T[] | false) => void
            ): void {
                if (!self.fetcher) {
                    throw new Error('Fetcher is not installed');
                }

                self.fetcher(text).then(update);
            },

            onSelect(item: T): void {
                self.selectedItem = item;
                self.input.value = self.valueExtractor(item);
                self.input.dataset.autocompleteItem = JSON.stringify(item);
                self.onSelectCallbacks.forEach(callback => callback(item));
            },

            render(item: T, currentValue: string): HTMLDivElement {
                let element = document.createElement('div');
                element.textContent = self.valueExtractor(item);
                element.classList.add('ac-item');

                self.onRenderCallbacks.forEach(callback => {
                    element = callback(element, item, currentValue);
                });

                return element;
            }
        });
    }
}