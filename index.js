const yargs = require('yargs');
const argv = yargs.usage('Usage: vue-i18n-extract-translations -v <path_to_vue_files> -l <path_to_locales> [options]')
    .options({
        'v': {
            describe: 'Pattern path to vue files. E.g, "./src/**/*.?(js|vue)"',
            demandOption: true,
        },
        'l': {
            describe: 'Pattern path to locale json files. E.g, "./src/locales/"',
            demandOption: true,
        },
        'key': {
            describe: 'Prefix for key-based translations',
            type: 'string',
            default: ''
        },
        'def-locale': {
            describe: 'Default locale name. Option creates json file, if locales were not found"',
            default: 'en_US',
            type: 'string'
        },
        'keep-unused': {
            describe: 'Keep old unused keys in locales',
            default: false,
            type: 'boolean'
        },
        'fill': {
            describe: 'Fill new translations with specified string. By default all new translation values equals their keys',
            type: 'string'
        },
        't': {
            alias: 'target',
            describe: 'List of locales to process. By default all locales will be processed.',
            type: 'array'
        },
    })
    .help('h')
    .alias('h', 'help')
    .example('vue-i18n-extract-translations -v "./src/**/*.?(js|vue)" -l "./src/locales/"', 'Extract all missing translations to json locale files.')
    .example('vue-i18n-extract-translations -v "./src/**/*.?(js|vue)" -l "./src/locales/" --key "i18n"', 'Key-based translations should have the beginning "i18n". E.g, $t("i18n.some.dot.string").\nOther translations will be parsed like normal strings, and dots will not be transformed to nested objects.')
    .example('vue-i18n-extract-translations -v "./src/**/*.?(js|vue)" -l "./src/locales/" --def-locale "fr_FR"', 'If locale directory is empty, create it and save translations to fr_FR.json file.')
    .example('vue-i18n-extract-translations -v "./src/**/*.?(js|vue)" -l "./src/locales/" --fill ""', 'Keep new translations empty.')
    .example('vue-i18n-extract-translations -v "./src/**/*.?(js|vue)" -l "./src/locales/" --target "en_US" "ru_RU"', 'Save translations only to en_US.json and ru_RU.json files. Nonexistent files will be created automatically.')
    .version(false)
    .wrap(yargs.terminalWidth())
    .argv;

const VueI18NExtract = require('vue-i18n-extract').default,
    path = require('path'),
    fs = require('fs').promises,
    items = VueI18NExtract.parseVueFiles(path.resolve(argv.v)),
    globby = require("globby"),
    dot = require('dot-object'),
    nestedObjectAssign = require('nested-object-assign');

const jsonFilesPath = path.resolve(argv.l);
const defaultLocale = argv.defLocale || 'en_US';
const fillEmpty = argv.fill !== undefined ? argv.fill : null;
const keyPrefix = argv.key !== undefined ? argv.key : '';

let strings = {
    'key': {},
    'str': {}
};

items.forEach(item => {
    let str = item.path;
    if (str.startsWith(keyPrefix)) {
        strings['key'][str] = fillEmpty !== null ? fillEmpty : (keyPrefix ? str.substring(str.indexOf(".") + 1) : str);
    } else {
        strings['str'][str] = fillEmpty !== null ? fillEmpty : str;
    }
});

const result = dot.dot(nestedObjectAssign(strings.str, dot.object(strings.key)));
strings.key = dot.dot(strings.key);

console.log("\nFound: " + Object.keys(result).length);

const getJsonFiles = async () => {
    const allJsonFiles = await globby(path.join(jsonFilesPath, (argv.t ? "(" + argv.t.join('|') + ")+.json" : "*.?(json)")).replace(/\\/g, '/'));
    const jsonFiles = await createDefaultLocale(allJsonFiles);
    return jsonFiles;
};

const createDefaultLocale = async (jsonFiles) => {
    const defaultLocalePath = path.join(jsonFilesPath, defaultLocale + '.json');
    await fs.mkdir(path.dirname(defaultLocalePath), {recursive: true});
    if (!Object.keys(jsonFiles).length && !argv.t) {
        await fs.writeFile(defaultLocalePath, '{}');
        jsonFiles.push(defaultLocalePath);
    }
    if (argv.t) {
        for (let locale of argv.t) {
            let targetPath = path.join(jsonFilesPath, locale + '.json');
            try {
                await fs.writeFile(targetPath, '{}', {flag: 'wx'});
            } catch (e) {
            }
            jsonFiles.push(targetPath);
        }
    }
    return jsonFiles;
};

const writeToJsonFiles = async (files) => {
    for (let localePath of files) {
        let newTranslations = {
            'key': {},
            'str': {}
        };
        let report = '';
        let i = 0, total = 0;
        let translations = require(localePath);
        let nestedKeys = getNestedKeys(translations);

        translations = typeof translations === 'object' ? dot.dot(translations) : {};
        for (let key in result) {
            let singleTranslation = (key in translations) ? translations[key] : result[key];
            if (key in strings['key']) {
                newTranslations['key'][key] = singleTranslation;
            } else {
                newTranslations['str'][key] = singleTranslation;
            }

            i += !(key in translations) ? 1 : 0;

            delete translations[key];
        }

        total += Object.keys(newTranslations['str']).length + Object.keys(newTranslations['key']).length + (argv.keepUnused ? Object.keys(translations).length : 0);

        translations = nestedObjectAssign(argv.keepUnused ? dotObject(translations, nestedKeys) : {}, newTranslations['str'], dot.object(newTranslations['key']));

        await fs.writeFile(localePath, JSON.stringify(translations));

        report += `\nLocale file: ${path.basename(localePath)}\n` +
            `  Added: ${i}\n` +
            `  Total: ${total}`;
        console.log(report);
    }
};

const getNestedKeys = (obj) => {
    let nested = {};
    for (let key in obj) {
        typeof obj[key] === 'object' && nestedObjectAssign(nested, dot.dot({
            [key]: obj[key]
        }));
    }
    return nested;
};

const dotObject = (obj, target) => {
    for (let key in target) {
        if (key in obj) {
            dot.str(key, obj[key], obj);
            delete obj[key];
        }
    }
    return obj;
};

getJsonFiles().then(files => writeToJsonFiles(files));