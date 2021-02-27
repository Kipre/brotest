/** 
* File to autotest the frameork
*/
import bro from './brotest.js';

bro.describe('equality', _=>{
    bro.test('deep equal', _=>{
        // https://stackoverflow.com/questions/201183/how-to-determine-equality-for-two-javascript-objects
        bro.expect(bro.helpers.deepEqual(null,null)).toBe(true);
        bro.expect(bro.helpers.deepEqual(null,undefined)).toBe(false);
        bro.expect(bro.helpers.deepEqual(/abc/, /abc/)).toBe(false);
        bro.expect(bro.helpers.deepEqual(/abc/, /123/)).toBe(false);
        const r = /abc/;
        bro.expect(bro.helpers.deepEqual(r, r)).toBe(true);

        bro.expect(bro.helpers.deepEqual("hi","hi")).toBe(true);
        bro.expect(bro.helpers.deepEqual(5,5)).toBe(true);
        bro.expect(bro.helpers.deepEqual(5,10)).toBe(false);

        bro.expect(bro.helpers.deepEqual([],[])).toBe(true);
        bro.expect(bro.helpers.deepEqual([1,2],[1,2])).toBe(true);
        bro.expect(bro.helpers.deepEqual([1,2],[2,1])).toBe(false);
        bro.expect(bro.helpers.deepEqual([1,2],[1,2,3])).toBe(false);

        bro.expect(bro.helpers.deepEqual({},{})).toBe(true);
        bro.expect(bro.helpers.deepEqual({a:1,b:2},{a:1,b:2})).toBe(true);
        bro.expect(bro.helpers.deepEqual({a:1,b:2},{b:2,a:1})).toBe(true);
        bro.expect(bro.helpers.deepEqual({a:1,b:2},{a:1,b:3})).toBe(false);

        bro.expect(bro.helpers.deepEqual({1:{name:"mhc",age:28}, 2:{name:"arb",age:26}},{1:{name:"mhc",age:28}, 2:{name:"arb",age:26}})).toBe(true);
        bro.expect(bro.helpers.deepEqual({1:{name:"mhc",age:28}, 2:{name:"arb",age:26}},{1:{name:"mhc",age:28}, 2:{name:"arb",age:27}})).toBe(false);

        Object.prototype.equals = function (obj) { return bro.helpers.deepEqual(this, obj); };

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
        bro.expect(bro.helpers.deepEqual([1, 2, undefined], [1, 2])).toBe(false);
        bro.expect(bro.helpers.deepEqual([1, 2, 3], { 0: 1, 1: 2, 2: 3 })).toBe(false);
        bro.expect(bro.helpers.deepEqual(new Date(1234), 1234)).toBe(false);

        // no two different function is equal really, they capture their context constiables
        // so even if they have same toString(), they won't have same functionality
        const func = function (x) { return true; };
        const func2 = function (x) { return true; };
        bro.expect(bro.helpers.deepEqual(func, func)).toBe(true);
        bro.expect(bro.helpers.deepEqual(func, func2)).toBe(false);
        bro.expect(bro.helpers.deepEqual({ a: { b: func } }, { a: { b: func } })).toBe(true);
        bro.expect(bro.helpers.deepEqual({ a: { b: func } }, { a: { b: func2 } })).toBe(false);
    });
});

bro.run();