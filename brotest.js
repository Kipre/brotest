class Bro {
    constructor() {
        this.tests = [];
    }
    
    test(name, fn, timeout) {
        this.tests.push({name, fn, timeout});
    }

    expect(value) {
        return new Expectation(value);
    }

    run() {
        let errors = 0;
        for (const {name, fn, timeout} of this.tests) {
            try {
                fn();
            } catch (e) {
                console.error(name, 'failed', e);
                errors++;
            }
        }
        if (!errors) {
            console.log(`%cAll ${this.tests.length} tests ran successfully.`, 'color: green');
        } else {
            console.log(`%c${errors} out of ${this.tests.length} tests failed.`, 'color: red');
        }
    }
}

class Expectation {
    constructor(value) {
        this.value = value;
    }

    toBe(expectedValue) {
        if (this.value !== expectedValue) {
            throw `because ${this.value} is not ${expectedValue}`;
        }
    }

    toMatchObject(object) {
        for (const property in object) {
            if (this.value[property] != object[property]) {
                throw `because in property "${property}" that is ${this.value[property]} does not match ${object[property]}`;
            }
        }
    }
}

export default new Bro();