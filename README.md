# Autocomplete widget

## Installation
```bash
yarn add autocomplete-widget
```

## Quick start
```typescript
type ItemType = {
    name: {common: string, official: string}
}

const input = document.querySelector<HTMLInputElement>('input#form_country')!;
const autocompleter = new Autocompleter<ItemType>(input, item => item.name.common);

autocompleter
    .setFetcher((text: string) => {
        return fetch('https://restcountries.com/v3.1/name/' + text)
            .then(response => response.json());
    })
    .onSelect((item: any) => {
        alert(item.name.official);
    })
    .create()
;
```