# brotest: unit-tests in the browser

poorly-designed micro-framework for testing my vanilla js projects

### usage:

1. make a test directory `mkdir test`
2. add submodule `git submodule add https://github.com/Kipre/brotest.git`
3. create test file `echo "import bro from './brotest/brotest.js'; bro.test('works', () => {bro.expect(1 + 1).toEqual(2)});" > firstTest.js`
4. create index file `echo "<script type='module'> import bro from './brotest/brotest.js'; import './firstTest.js'; bro.run(); </script>" > index.html`
5. serve project and navigate to test directory
