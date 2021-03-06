import ui from './ui.js';

function currentFile() {
    const matches = new Error().stack.match(/(?<=https?:\/\/[^\/]*\/)[^:]*/ig);
    return matches[matches.length - 1];
}

function emptyObj(obj) {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}

function deepEqual(x, y) {
    'use strict';
    // https://stackoverflow.com/questions/201183/how-to-determine-equality-for-two-javascript-objects
    if (x === null || x === undefined || y === null || y === undefined) {
        return x === y;
    }
    // after this just checking type of one would be enough
    if (x.constructor !== y.constructor) {
        return false;
    }
    // if they are functions, they should exactly refer to same one (because of closures)
    if (x instanceof Function) {
        return x === y;
    }
    // if they are regexps, they should exactly refer to same one (it is hard to better equality check on current ES)
    if (x instanceof RegExp) {
        return x === y;
    }
    if (x === y || x.valueOf() === y.valueOf()) {
        return true;
    }
    if (Array.isArray(x) && x.length !== y.length) {
        return false;
    }

    // if they are dates, they must had equal valueOf
    if (x instanceof Date) {
        return false;
    }

    // if they are strictly equal, they both need to be object at least
    if (!(x instanceof Object)) {
        return false;
    }
    if (!(y instanceof Object)) {
        return false;
    }

    // recursive object equality check
    var p = Object.keys(x);
    return Object.keys(y).every(function(i) {
        return p.indexOf(i) !== -1;
    }) && p.every(function(i) {
        return deepEqual(x[i], y[i]);
    });
}


const matches = (expected,value)=>{
    for (const prop in expected) {
        const val = expected[prop];
        if (!(prop in value))
            return false;
        const isPrimitive = Object(val) === val;
        if (!isPrimitive && !matches(val, value[prop]))
            return false;
        if (isPrimitive && val !== value[prop])
            return false;
    }
    return true;
}

class Bro {
    constructor() {
        this.files = {};
        this.nbTests = 0;
        this.currentBlock = null;
        this.helpers = {
            deepEqual,
            matches
        };
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

    async causesError(name, fn) {
        try {
            await fn();
        } catch (e) {
            return [true, `${name} failed`, e];
        }
        return [false, "", null];
    }

    async run() {
        const runOne = async({name, fn, timeout, display})=>{
            const [fail,message,error] = await this.causesError(name, fn);
            errors += fail;
            display(!fail, message, error);
        }
        let errors = 0;
        for (const file in this.files) {
            for (const {name, fn, timeout, display, tests} of this.files[file].blocks) {
                if (tests) {
                    for (const test of tests) {
                        await runOne(test)
                    }
                } else {
                    await runOne({
                        name,
                        fn,
                        timeout,
                        display
                    });
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
        if (!matches(object, this.value)) {
            throw new Error(`because ${JSON.stringify(this.value)} does not match ${JSON.stringify(object)} on property ${property}.⚠`);
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
