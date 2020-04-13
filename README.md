<h1>vue-i18n-extract-translations</h1>

`vue-i18n-extract-translations` allows you to get key-based and message locale strings from your *.vue and *.js files and save them to json files.
       
Based on [vue-i18n-extract](https://www.npmjs.com/package/vue-i18n-extract) and used it functionality for collecting keys.

## Installation:

```bash
npm install vue-i18n-extract-translations --save-dev
```
or
```bash
yarn add -D vue-i18n-extract-translations
```

## Usage :

Add to `package.json`:

```json
{
  "scripts": {
    "vue-i18n-extract-translations": "vue-i18n-extract-translations"
  }
}
```

Common usage:

```bash
yarn vue-i18n-extract-translations -v <path_to_vue_files> -l <path_to_locales> [options]
```

or

```bash
npm run vue-i18n-extract-translations -v <path_to_vue_files> -l <path_to_locales> [options]
```

### All options

Option        | Default    | Necessity  | Description
------------- | ---------- | ---------- | -----------
-v            |            | required   | Pattern path to vue files
-l            |            | required   | Pattern path to locale json files. <br> Automatically creates specified directory
--key         | ""         | optional   | Prefix for key-based translations. By default is empty
--def-locale  | en_US      | optional   | Default locale name. Option creates json file, if locales were not found
--keep-unused | false      | optional   | Keep old unused keys in locale files 
--fill        |            | optional   | Fill new translations with specified string. By default all new translation values equals their keys
-t, --target  | array      | optional   | List of locales to process. By default all locales will be processed.
-h, --help    |            | optional   | Show help
   
## Examples

###Extract all missing translations to json locale files.

```bash
yarn vue-i18n-extract-translations -v "./src/**/*.?(js|vue)" -l "./src/locales/"
```

Paths can be absolute or relative.

###Key-based format translations

By default script uses key-based format and extract dot strings as objects.

Your locale strings probably looks like: `$t('header.message')`, `$t('header.another_message')` or `$t('single_message')`. 

Generated json file will be: 

```json
{
    "header": {
      "message" : "header.message",
      "another_message" : "header.another_message"
    },
    "single_message": "single_message"  
}
```
###Message format translations

Your locale strings probably looks like: `$t('Some long  message. Love you')`

By default script will create such json file: 

```json
{
    "Some long message": {
      "Love you" : "Love you"
    }  
}
```

Use option `--key` to prevent it:

```bash
yarn vue-i18n-extract-translations -v "./src/**/*.?(js|vue)" -l "./src/locales/" --key "i18n"
```

Now all dots in the strings will be ignored: 

```json
{
    "Some long  message. Love you": "Some long  message. Love you"
}
```

###Combine key-based and message format

You may have both formats: `$t('header.message')`, `$t('header.another_message')`, `$t('Some long  message. Love you')`.

Use option `--key` with value `i18n` and change key-based strings like so: `$t('i18n.header.message')`, `$t('i18n.header.another_message')`

Result json:

```json
{
    "Some long  message. Love you": "Some long  message. Love you",
    "i18n": {
        "header": {
            "message" : "header.message",
            "another_message" : "header.another_message"
         }
    }
}
```

###Default locale folder

```bash
yarn vue-i18n-extract-translations -v "./src/**/*.?(js|vue)" -l "./src/locales/" --def-locale "fr_FR"
```

If locale directory is empty, script will create it and save translations to fr_FR.json file:

###Keep new translations empty

If you don't want the values of new translations to be keys, use option `--fill`.

You can make them empty:

```bash
yarn vue-i18n-extract-translations -v "./src/**/*.?(js|vue)" -l "./src/locales/" --fill "" 
```

or not:

```bash
yarn vue-i18n-extract-translations -v "./src/**/*.?(js|vue)" -l "./src/locales/" --fill "Translate me!" 
```

###Save translations only to specified locales

```bash
yarn vue-i18n-extract-translations -v "./src/**/*.?(js|vue)" -l "./src/locales/" --target "en_US" "ru_RU" 
```

This command will save translations only to en_US.json and ru_RU.json files. Nonexistent files will be created automatically.