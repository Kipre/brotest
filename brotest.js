import ui from './ui.js';

function currentFile() {
    const matches = new Error().stack.match(/(?<=https?:\/\/[^\/]*\/)[^:]*/ig);
    return matches[matches.length - 1];
}

function emptyObj(obj) {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}

function deepEqual(a, b) {
    function loop(a, b) {
        for (let prop in a) {
            if (!deepEqual(a[prop], b[prop]))
                return false;
        }
        return typeof a == typeof b;
    }
    if (a !== Object(a) || b !== Object(b)) {
        return a == b;
    } else if (Object.keys(a).length >= Object.keys(b).length) {
        return loop(a, b);
    } else {
        return loop(b, a);
    }
}

class Bro {
    constructor() {
        this.files = {};
        this.nbTests = 0;
        this.currentBlock = null;
        this.helpers = {deepEqual};
    }

    test(name, fn, timeout) {
        this.nbTests++;
        const [file,block] = [currentFile(), this.currentBlock];
        this.currentTests(file, block).push({
            name,
            fn,
            timeout,
            display: ui.addTest(file, block, name)
        });
    }

    describe(name, fn) {
        this.currentBlock = name;
        fn();
        this.currentBlock = null;
    }

    expect(value) {
        return new Expectation(value);
    }

    causesError(name, fn) {
        try {
            fn();
        } catch (e) {
            return [true, `${name} failed`, e];
        }
        return [false, "", null];
    }

    async run() {
//         console.log(this.files);
        const runOne = ({name, fn, timeout, display})=>{
            const [fail, message, error] = this.causesError(name, fn);
            errors += fail;
            display(!fail, message, error);
        }
        let errors = 0;
        for (const file in this.files) {
            for (const {name, fn, timeout, display, tests} of this.files[file].blocks) {
                if (tests) {
                    for (const test of tests) {
                        runOne(test)
                    }
                } else {
                    runOne({name, fn, timeout, display});
                }
            }

        }
        ui.finished(errors == 0, this.nbTests, errors)
    }

    currentTests(filename, block) {
        if (!(filename in this.files)) {
            this.files[filename] = {
                blocks: []
            }
        }
        if (block) {
            const blocks = this.files[filename].blocks;
            const lastBlock = blocks[blocks.length - 1];
            //             console.log('last block', lastBlock);
            if (lastBlock?.name == block) {
                return lastBlock.tests;
            } else {
                const newBlock = {
                    name: block,
                    tests: []
                }
                this.files[filename].blocks.push(newBlock);
                return newBlock.tests;
            }
        }
        return this.files[filename].blocks;
    }

    getFile(filename) {
        if (!(filename in this.files)) {
            this.files[filename] = {
                blocks: []
            }
        }
        return this.files[filename];
    }

    get currentFile() {
        const filename = currentFile()
        if (!(filename in this.files)) {
            this.files[filename] = {
                blocks: []
            }
        }
        return this.files[filename];
    }
}

class Expectation {
    constructor(value) {
        this.value = value;
    }

    toBe(expectedValue) {
        if (this.value !== expectedValue) {
            throw new Error(`because ${this.value} is not ${expectedValue}⚠`);
        }
    }

    toMatchObject(object) {
        for (const property in object) {
            if (this.value[property] != object[property]) {
                throw new Error(`because in property "${property}" which is ${this.value[property]} does not match ${object[property]}.⚠`);
            }
        }
    }

    toEqual(object) {
        if (!deepEqual(this.value, object)) {
            throw new Error(`because ${JSON.stringify(this.value)} does not match ${JSON.stringify(object)}.⚠`);
        }
    }
    
    toHaveLength(number) {
        if (this.value.length !== number) {
            throw new Error(`because ${JSON.stringify(this.value)} does not have a length of ${number}.⚠`);
        }
    }
}

export default new Bro();
