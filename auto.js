/** 
* File to autotest the frameork
*/
import bro from './brotest.js';

bro.describe('equality', _=>{
    bro.test('deep equal', _=>{
        // https://stackoverflow.com/questions/201183/how-to-determine-equality-for-two-javascript-objects
        bro.expect(bro.helpers.deepEqual(2, 3)).toBe(false);
        bro.expect(bro.helpers.deepEqual(2, 2)).toBe(true);
        bro.expect(bro.helpers.deepEqual({}, {a: 3})).toBe(false);
        bro.expect(bro.helpers.deepEqual({a: 3}, {a: 3})).toBe(true);
        bro.expect(bro.helpers.deepEqual({}, {})).toBe(true);
        bro.expect(bro.helpers.deepEqual([], [])).toBe(true);
        bro.expect(bro.helpers.deepEqual([], {})).toBe(false);
        bro.expect(bro.helpers.deepEqual([1], [])).toBe(false);
        bro.expect(bro.helpers.deepEqual([1, 2], [1, 2])).toBe(false);
    });
});

bro.run();