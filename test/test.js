var Zocci=require('..'), assert=require('assert'), fs=require('fs'),  path=require('path'),
   html='', w, exit;

describe('Store', function() {
  var store, app;

  it('should create a new Zocci store', function() {
    store=new Zocci(__dirname+'/test-'+rnd()+'.json');
    assert(store);
  });
  it('should be empty', function() {
    assert.equal(store.find('').length, 0);
  });
  it('should set "port" (number)', function() {
    store.set('port', 80);
  });
  it('should get "port"', function() {
    assert.equal(store.get('port'), 80);
  });
  it('should get complete object', function() {
    assert.json_equal(store.get(), {port:80});
  });
  it('should set "names" (array)', function() {
    store.set('names', ['test0', 'test1']);
  });
  it('should get "names"', function() {
    assert.json_equal(store.get('names'), ['test0', 'test1']);
  });
  it('should get item in "names"', function() {
    assert.equal(store.get('names.1'), 'test1');
  });
  it('should set "path" (object)', function() {
    store.set('path', {base:'/', test:'/test'});
  });
  it('should get "path"', function() {
    assert.json_equal(store.get('path'), {base:'/', test:'/test'});
  });
  it('should get subkey of "path"', function() {
    assert.equal(store.get('path.test'), '/test');
  });
  it('should set subkey of "path"', function() {
    store.set('path.lib', {js:'/lib/js', css:'/lib/css'});
  });
  it('should get new subkey of "path"', function() {
    assert.json_equal(store.get('path.lib'), {js:'/lib/js', css:'/lib/css'});
  });
  it('should get new "path"', function() {
    assert.json_equal(store.get('path'), {
      base:'/', test:'/test', lib:{js:'/lib/js', css:'/lib/css'}
    });
  });
  it('should manipulate "path"', function() {
    store.access('path.lib').fonts='/lib/fonts';
    assert.json_equal(store.get('path.lib'), {
      js:'/lib/js', css:'/lib/css', fonts:'/lib/fonts'
    });
  });
  it('should remove subkey of "path"', function() {
    store.remove('path.lib', {js:'/lib/js', css:'/lib/css'});
    assert.json_equal(store.get('path'), {base:'/', test:'/test'});
  });
  it('should contain 3 items', function() {
    assert.equal(store.find('').length, 3);
  });
  it('should return keys of 2 items starting with "p"', function() {
    assert.equal(store.find('p', true).length, 2);
  });
  it('should find 2 items starting with "p"', function() {
    assert.equal(store.find('p').length, 2);
  });
  it('should find 2 items with regex /^p.+/', function() {
    assert.equal(store.find(/^p.+/).length, 2);
  });
  it('should remove item', function() {
    store.remove('path');
    assert.equal(store.find('').length, 2);
  });
  it('should return default value or null', function() {
    assert.equal(store.get('foo', 'bar'), 'bar');
    assert.equal(store.get('foo'), null);
    store.set('foo', {});
    assert.equal(store.get('foo.bar', 'baz'), 'baz');
  });
  it('should use subSelector', function() {
    app=store.subSelector('app');
  });
  it('should use subSelector.set and get', function() {
    store.set('app', {app1:{name:'one'}, app2:{name:'two', x:2}});
    app('app3').set();
    app('app3').set('name', 'three');
    assert.json_equal(app('app1').get(), {name:'one'});
    assert.equal(app('app2').get('name'), 'two');
    assert.json_equal(app('app3').get(), {name:'three'});
    app('app3').remove();
  });
  it('should use subSelector.remove', function() {
    app('app2').remove('name');
    assert.json_equal(app('app2').get(), {x:2});
  });
  it('should emit change event on "set"', function() {
    var args;
    store.on('change', function() {
      args=arguments;
    });
    store.set('foo', 'bar');
    assert(args);
    assert.equal(args[0], 'foo');
    assert.equal(args[1], 'bar');
  });
  it('should emit change event on "remove"', function() {
    var args;
    store.on('change', function() {
      args=arguments;
    });
    store.remove('foo');
    assert(args);
    assert.equal(args[0], 'foo');
    assert.equal(args[1], null);
  });
  it('should reload without an error', function() {
    assert(store.reload());
  });
  it('should return false if there was an error', function() {
    var path=store.path;
    store.path=__filename;
    assert(!store.reload());
    store.path=path;
  });
  it('should cb with err if file could not be saved', function(done) {
    var store=new Zocci(__dirname+'/test-'+rnd()+'.json'), path=store.path;
    store.save(function(err) {
      assert(!err);
      store.path=__dirname+'/does/not/exist';
      store.on('error', function() {});
      store.save(function(err) {
        store.path=path;
        unlinkStore(store, done);
        assert(!!err);
      });
    });
  });
  it('should emit err if file could not be saved', function(done) {
    var store=new Zocci(__dirname+'/test-'+rnd()+'.json'), path=store.path;
    store.save(function(err) {
      assert(!err);
      store.on('error', function() {
        store.path=path;
        unlinkStore(store, done);
      });
      store.path=__dirname+'/does/not/exist';
      store.set('foo', 'bar');
    });
  });

  after(function(done) {
    unlinkStore(store, done);
  });
});


describe('Options', function() {
  it('should create a new Zocci store with default options', function(done) {
    var store=new Zocci(__dirname+'/test-'+rnd()+'.json', {});
    assert(store);
    assert.equal(store.opts.delimiter, '.');
    assert.equal(store.opts.jsonSpaces, 2);
    unlinkStore(store, done);
  });

  it('should create a new Zocci store with custom options', function(done) {
    var store=new Zocci(__dirname+'/test-'+rnd()+'.json', {delimiter:'->', jsonSpaces:8});
    assert(store);
    assert.equal(store.opts.delimiter, '->');
    assert.equal(store.opts.jsonSpaces, 8);
    unlinkStore(store, done);
  });

  it('should create a new Zocci store with custom delimiter', function(done) {
    var store=new Zocci(__dirname+'/test-'+rnd()+'.json', '->');
    assert(store);
    assert.equal(store.opts.delimiter, '->');
    unlinkStore(store, done);
  });

  it('should create a new Zocci store with custom spacing', function(done) {
    var store=new Zocci(__dirname+'/test-'+rnd()+'.json', 8);
    assert(store);
    assert.equal(store.opts.jsonSpaces, 8);
    unlinkStore(store, done);
  });

  describe('delimiter', function() {
    var store;

    it('should create a new Zocci store with "/" delimiter', function() {
      store=new Zocci(__dirname+'/test-'+rnd()+'.json', '/');
      assert(store);
      assert.equal(store.opts.delimiter, '/');
      assert.equal(store.opts.jsonSpaces, 2);
    });
    it('should set "path" (object)', function() {
      store.set('path', {base:'/', test:'/test', lib:{js:'/lib/js', css:'/lib/css'}});
    });
    it('should get subkey of "path"', function() {
      assert.equal(store.get('path/test'), '/test');
    });
    it('should get deeper subkey of "path"', function() {
      assert.equal(store.get('path/lib/js'), '/lib/js');
    });

    after(function(done) {
      unlinkStore(store, done);
    });
  });

  describe('jsonSpaces', function() {
    var store;

    it('should create a new Zocci store with spacing size 4', function() {
      store=new Zocci(__dirname+'/test-'+rnd()+'.json', 4);
      assert(store);
      assert.equal(store.opts.jsonSpaces, 4);
    });
    it('should use 4 spaces in json file', function(done) {
      store.set('foo', 'bar', function() {
        fs.readFile(store.path, function(err, data) {
          assert.equal(data.toString(), '{\n    "foo": "bar"\n}');
          done();
        });
      });
    });
    it('should use 2 spaces for true', function(done) {
      store.opts.jsonSpaces=true;
      store.set('foo', 'bar', function() {
        fs.readFile(store.path, function(err, data) {
          assert.equal(data.toString(), '{\n  "foo": "bar"\n}');
          done();
        });
      });
    });

    after(function(done) {
      unlinkStore(store, done);
    });
  });
});

assert.json_equal=function(ob1, ob2) {
  assert.equal(JSON.stringify(ob1), JSON.stringify(ob2));
};

function rnd() {
  return Math.random().toString(36).substr(-8);
}

function unlinkStore(store, cb) {
  store.save(function() {
    fs.unlink(store.path, cb);
  });
}
