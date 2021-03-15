/** 
* File to autotest the framework
*/
import bro from './brotest.js';
import {primitiveEqual, deepEqual, matches, Bro, Expectation} from './brotest.js';

bro.describe('equalities', _=>{

    bro.test('primitive equal', _=>{
        bro.expect(primitiveEqual(0, 0)).toBe(true);
        bro.expect(primitiveEqual(1, 0)).toBe(false);
        bro.expect(primitiveEqual(3, 2)).toBe(false);
        bro.expect(primitiveEqual(2, 2)).toBe(true);
        bro.expect(primitiveEqual(-2, -2)).toBe(true);
        bro.expect(primitiveEqual(2.0, 2)).toBe(true);
        bro.expect(primitiveEqual(-1.0, 0.0)).toBe(false);
        bro.expect(primitiveEqual('t', 't')).toBe(true);
        bro.expect(primitiveEqual('r', 't')).toBe(false);
        bro.expect(primitiveEqual(null, null)).toBe(true);
        bro.expect(primitiveEqual(undefined, undefined)).toBe(true);
        bro.expect(primitiveEqual(true, true)).toBe(true);
        bro.expect(primitiveEqual(false, false)).toBe(true);
        bro.expect(primitiveEqual(false, null)).toBe(false);
        bro.expect(primitiveEqual(false, undefined)).toBe(false);
        bro.expect(primitiveEqual(undefined, null)).toBe(false);
        bro.expect(primitiveEqual(true, 1)).toBe(false);
        bro.expect(primitiveEqual(/r/, /r/)).toBe(false);
        bro.expect(primitiveEqual({}, {})).toBe(undefined);
        const obj = {a: 3};
        const c = obj;
        bro.expect(primitiveEqual(obj, obj)).toBe(true);
        bro.expect(primitiveEqual(obj, c)).toBe(true);
        bro.expect(primitiveEqual({a: 3}, obj)).toBe(undefined);
        bro.expect(primitiveEqual({a: 3}, {a: 3})).toBe(undefined);
        bro.expect(primitiveEqual({a: 3}, {a: 4})).toBe(undefined);
        bro.expect(primitiveEqual([3], {a: 4})).toBe(false);
        bro.expect(primitiveEqual([3], [3])).toBe(undefined);
    });
    
    bro.test('deep equal', _=>{
        // https://stackoverflow.com/questions/201183/how-to-determine-equality-for-two-javascript-objects
        bro.expect(deepEqual(null,null)).toBe(true);
        bro.expect(deepEqual(null,undefined)).toBe(false);
        bro.expect(deepEqual(/abc/, /abc/)).toBe(false);
        bro.expect(deepEqual(/abc/, /123/)).toBe(false);
        const r = /abc/;
        bro.expect(deepEqual(r, r)).toBe(true);

        bro.expect(deepEqual("hi","hi")).toBe(true);
        bro.expect(deepEqual(5,5)).toBe(true);
        bro.expect(deepEqual(5,10)).toBe(false);

        bro.expect(deepEqual([],[])).toBe(true);
        bro.expect(deepEqual([1,2],[1,2])).toBe(true);
        bro.expect(deepEqual([1,2],[2,1])).toBe(false);
        bro.expect(deepEqual([1,2],[1,2,3])).toBe(false);

        bro.expect(deepEqual({},{})).toBe(true);
        bro.expect(deepEqual({a:1,b:2},{a:1,b:2})).toBe(true);
        bro.expect(deepEqual({a:1,b:2},{b:2,a:1})).toBe(true);
        bro.expect(deepEqual({a:1,b:2},{a:1,b:3})).toBe(false);

        bro.expect(deepEqual({1:{name:"mhc",age:28}, 2:{name:"arb",age:26}},{1:{name:"mhc",age:28}, 2:{name:"arb",age:26}})).toBe(true);
        bro.expect(deepEqual({1:{name:"mhc",age:28}, 2:{name:"arb",age:26}},{1:{name:"mhc",age:28}, 2:{name:"arb",age:27}})).toBe(false);

        Object.prototype.equals = function (obj) { return deepEqual(this, obj); };

        bro.expect({}.equals(null)).toBe(false);
        bro.expect({}.equals(undefined)).toBe(false);

        bro.expect("hi".equals("hi")).toBe(true);
        bro.expect(new Number(5).equals(5)).toBe(true);
        bro.expect(new Number(5).equals(10)).toBe(false);
        bro.expect(new Number(1).equals("1")).toBe(false);

        bro.expect([].equals([])).toBe(true);
        bro.expect([1,2].equals([1,2])).toBe(true);
        bro.expect([1,2].equals([2,1])).toBe(false);
        bro.expect([1,2].equals([1,2,3])).toBe(false);
        bro.expect(new Date("2011-03-31").equals(new Date("2011-03-31"))).toBe(true);
        bro.expect(new Date("2011-03-31").equals(new Date("1970-01-01"))).toBe(false);

        bro.expect({}.equals({})).toBe(true);
        bro.expect({a:1,b:2}.equals({a:1,b:2})).toBe(true);
        bro.expect({a:1,b:2}.equals({b:2,a:1})).toBe(true);
        bro.expect({a:1,b:2}.equals({a:1,b:3})).toBe(false);

        bro.expect({1:{name:"mhc",age:28}, 2:{name:"arb",age:26}}.equals({1:{name:"mhc",age:28}, 2:{name:"arb",age:26}})).toBe(true);
        bro.expect({1:{name:"mhc",age:28}, 2:{name:"arb",age:26}}.equals({1:{name:"mhc",age:28}, 2:{name:"arb",age:27}})).toBe(false);

        const a = {a: 'text', b:[0,1]};
        const b = {a: 'text', b:[0,1]};
        const c = {a: 'text', b: 0};
        const d = {a: 'text', b: false};
        const e = {a: 'text', b:[1,0]};
        const i = {
            a: 'text',
            c: {
                b: [1, 0]
            }
        };
        const j = {
            a: 'text',
            c: {
                b: [1, 0]
            }
        };
        const k = {a: 'text', b: null};
        const l = {a: 'text', b: undefined};

        bro.expect(a.equals(b)).toBe(true);
        bro.expect(a.equals(c)).toBe(false);
        bro.expect(c.equals(d)).toBe(false);
        bro.expect(a.equals(e)).toBe(false);
        bro.expect(i.equals(j)).toBe(true);
        bro.expect(d.equals(k)).toBe(false);
        bro.expect(k.equals(l)).toBe(false);

        // from comments on stackoverflow post
        bro.expect(deepEqual([1, 2, undefined], [1, 2])).toBe(false);
        bro.expect(deepEqual([1, 2, 3], { 0: 1, 1: 2, 2: 3 })).toBe(false);
        bro.expect(deepEqual(new Date(1234), 1234)).toBe(false);

        // no two different function are equal really, they capture their context constiables
        // so even if they have same toString(), they won't have same functionality
        const func = function (x) { return true; };
        const func2 = function (x) { return true; };
        bro.expect(deepEqual(func, func)).toBe(true);
        bro.expect(deepEqual(func, func2)).toBe(false);
        bro.expect(deepEqual({ a: { b: func } }, { a: { b: func } })).toBe(true);
        bro.expect(deepEqual({ a: { b: func } }, { a: { b: func2 } })).toBe(false);
    });
});

bro.describe('object matching', _=>{
    bro.test('match', _=>{
        bro.expect(matches({0: 1}, {0: 1})).toBe(true);
        bro.expect(matches({0: 1}, {0: 1, 1: 2})).toBe(true);
        bro.expect(matches({0: 2}, {0: 1})).toBe(false);
        bro.expect(matches({0:{2: 4}}, {0: {2: 4}, 'r': 'k'})).toBe(true);
        bro.expect(matches({0:{2: 4}}, {0: {2: 5}, 'r': 'k'})).toBe(false);
        bro.expect(matches([{cursels:[[1,3,1,3]], text:"some\ntext here"}], 
                           [{cursels:[[1,3,1,3]], text:"some\ntext here"}])).toBe(true);
        bro.expect(matches({"l":1,"c":3,"tl":null,"tc":null}, {"l":1,"c":3,"tl":null,"tc":null,"hc":3})).toBe(true);
    });
});

bro.describe('expectations', _=>{

    bro.test('to match object', _=>{
        bro.expect({a: 2, b: 3}).toMatchObject({a: 2});
        bro.expect({a: 2, b: 3}).toMatchObject({});
        bro.expect({a: 2, b: 3}).toMatchObject({b: 3});
        bro.expect({a: 2, b: 3}).toMatchObject({a: 2, b: 3});
        
        bro.expect(() => new Expectation({a: 2, b: 3}).toMatchObject({a: 1})).toThrow();
    })
})

bro.run();