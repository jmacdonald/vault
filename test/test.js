(function() {
  var urls;
  urls = {
    list: "test.json"
  };
  describe('Vault', function() {
    var cars;
    cars = null;
    beforeEach(function() {
      localStorage.clear();
      cars = new Vault('cars', urls, {
        offline: true,
        sub_collections: ['parts', 'dealers']
      });
      return waitsFor(function() {
        return !cars.locked;
      });
    });
    it('can load objects', function() {
      expect(cars.objects.length).toEqual(3);
      return expect(cars.dirty_object_count).toEqual(0);
    });
    it('can store objects', function() {
      return expect(cars.store).toBeTruthy();
    });
    it('can enumerate objects', function() {
      var cars_visited;
      cars_visited = 0;
      cars.each(function() {
        return cars_visited++;
      });
      return expect(cars_visited).toEqual(3);
    });
    it('can find top-level objects', function() {
      var car;
      car = cars.find(1);
      return expect(car.model).toEqual("Shelby Mustang GT500");
    });
    it('can find second-level objects using the convenience class', function() {
      var dealer, part;
      part = cars.parts.find(3);
      dealer = cars.dealers.find(1);
      expect(part.name).toEqual("Turbocharger");
      return expect(dealer.name).toEqual("Super Car Mart");
    });
    it('can find second-level objects', function() {
      var car, part;
      car = cars.find(2);
      part = car.parts.find(3);
      return expect(part.name).toEqual("Turbocharger");
    });
    it('can find top-level objects using a string-based id', function() {
      var car;
      car = cars.find("1");
      return expect(car.model).toEqual("Shelby Mustang GT500");
    });
    it('can find second-level objects using the convenience class and a string-based id', function() {
      var dealer, part;
      part = cars.parts.find("3");
      dealer = cars.dealers.find("1");
      expect(part.name).toEqual("Turbocharger");
      return expect(dealer.name).toEqual("Super Car Mart");
    });
    it('can find second-level objects using a string-based id', function() {
      var car, part;
      car = cars.find("2");
      part = car.parts.find("3");
      return expect(part.name).toEqual("Turbocharger");
    });
    it('always returns false when trying to find a non-existent object', function() {
      var car, dealer, part;
      car = cars.find(99);
      part = cars.parts.find(99);
      dealer = cars.find(1).dealers.find(99);
      expect(car).toEqual(false);
      expect(part).toEqual(false);
      return expect(dealer).toEqual(false);
    });
    it('can add objects', function() {
      var new_car;
      new_car = cars.add({
        make: "Dodge",
        model: "Viper SRT-10",
        year: 2008
      });
      expect(cars.objects.length).toEqual(4);
      expect(cars.dirty_object_count).toEqual(1);
      return expect(new_car.status).toEqual("new");
    });
    it('can add objects with a specified id', function() {
      var new_car;
      new_car = cars.add({
        id: 12,
        make: "Tesla",
        model: "Roadster",
        year: 2009
      });
      expect(cars.objects.length).toEqual(4);
      expect(cars.dirty_object_count).toEqual(1);
      return expect(new_car.status).toEqual("new");
    });
    it('adds an id to new objects if an id is specified but empty', function() {
      var new_car;
      new_car = cars.add({
        id: '',
        make: "Tesla",
        model: "Roadster",
        year: 2009
      });
      expect(cars.objects.length).toEqual(4);
      expect(cars.dirty_object_count).toEqual(1);
      expect(new_car.status).toEqual("new");
      return expect(new_car.id).not.toEqual("");
    });
    it('can add second-level objects', function() {
      var car, new_part;
      car = cars.find(2);
      new_part = car.parts.add({
        name: "Intercooler",
        year: 259.99
      });
      expect(car.parts.length).toEqual(2);
      expect(cars.objects.length).toEqual(3);
      expect(cars.dirty_object_count).toEqual(1);
      return expect(new_part.status).toEqual("new");
    });
    it('can add second-level objects with a specified id', function() {
      var car, new_part;
      car = cars.find(1);
      new_part = car.parts.add({
        id: 12,
        make: "ECU",
        year: 189.99
      });
      expect(car.parts.length).toEqual(3);
      expect(cars.objects.length).toEqual(3);
      expect(cars.dirty_object_count).toEqual(1);
      return expect(new_part.status).toEqual("new");
    });
    it('adds an id to new sub-objects if an id is specified but empty', function() {
      var car, new_part;
      car = cars.find(1);
      new_part = car.parts.add({
        id: '',
        make: "ECU",
        year: 189.99
      });
      expect(car.parts.length).toEqual(3);
      expect(cars.objects.length).toEqual(3);
      expect(cars.dirty_object_count).toEqual(1);
      expect(new_part.status).toEqual("new");
      return expect(new_part.id).not.toEqual("");
    });
    it('is storing objects after adding', function() {
      var new_car;
      new_car = cars.add({
        id: 12,
        make: "Tesla",
        model: "Roadster",
        year: 2009
      });
      expect(cars.load).toBeTruthy();
      expect(cars.objects.length).toEqual(4);
      return expect(cars.dirty_object_count).toEqual(1);
    });
    it('can read new objects', function() {
      var new_car;
      new_car = cars.add({
        make: "Dodge",
        model: "Viper SRT-10",
        year: 2008
      });
      return expect(cars.find(new_car.id).model).toEqual("Viper SRT-10");
    });
    it('can read new objects with a specified id', function() {
      var new_car;
      new_car = cars.add({
        id: 12,
        make: "Tesla",
        model: "Roadster",
        year: 2009
      });
      return expect(cars.find(12).model).toEqual("Roadster");
    });
    it('can read existing objects', function() {
      return expect(cars.find(2).model).toEqual("Lancer Evolution X");
    });
    it('can update new objects via instances', function() {
      var new_car;
      new_car = cars.add({
        make: "Dodge",
        model: "Viper SRT-10",
        year: 2008
      });
      new_car.make = "Lamborghini";
      new_car.model = "Murcielago";
      new_car.year = 2009;
      new_car.update();
      expect(cars.find(new_car.id).make).toEqual("Lamborghini");
      expect(cars.find(new_car.id).model).toEqual("Murcielago");
      expect(cars.find(new_car.id).year).toEqual(2009);
      expect(cars.find(new_car.id).status).toEqual('new');
      expect(cars.objects.length).toEqual(4);
      return expect(cars.dirty_object_count).toEqual(1);
    });
    it('can update existing objects via instances', function() {
      var car;
      car = cars.find(1);
      car.make = "Toyota";
      car.model = "Supra";
      car.year = 2002;
      car.update();
      expect(cars.find(1).make).toEqual("Toyota");
      expect(cars.find(1).model).toEqual("Supra");
      expect(cars.find(1).year).toEqual(2002);
      expect(cars.find(1).status).toEqual('dirty');
      expect(cars.objects.length).toEqual(3);
      return expect(cars.dirty_object_count).toEqual(1);
    });
    it('can update new sub-objects via instances', function() {
      var car, new_part;
      car = cars.find(1);
      new_part = car.parts.add({
        name: "Exhaust Manifold",
        price: 249.99
      });
      new_part.name = "Intake Filter";
      new_part.price = 19.99;
      new_part.update();
      expect(car.parts.find(new_part.id).name).toEqual("Intake Filter");
      expect(car.parts.find(new_part.id).price).toEqual(19.99);
      expect(car.status).toEqual('dirty');
      expect(cars.objects.length).toEqual(3);
      expect(car.parts.length).toEqual(3);
      expect(cars.dirty_object_count).toEqual(1);
      return expect(new_part.status).toEqual("new");
    });
    it('can update existing sub-objects via instances', function() {
      var car, part;
      car = cars.find(1);
      part = car.parts.find(1);
      part.name = "Exhaust Manifold";
      part.price = 249.99;
      part.update();
      expect(car.parts.find(1).name).toEqual("Exhaust Manifold");
      expect(car.parts.find(1).price).toEqual(249.99);
      expect(cars.find(1).status).toEqual('dirty');
      expect(cars.objects.length).toEqual(3);
      expect(car.parts.length).toEqual(2);
      return expect(cars.dirty_object_count).toEqual(1);
    });
    it('can update new objects by passing updated attributes as arguments', function() {
      var new_car;
      new_car = cars.add({
        make: "Dodge",
        model: "Viper SRT-10",
        year: 2008
      });
      new_car.update({
        make: "Lamborghini",
        model: "Murcielago",
        year: 2009
      });
      expect(cars.find(new_car.id).make).toEqual("Lamborghini");
      expect(cars.find(new_car.id).model).toEqual("Murcielago");
      expect(cars.find(new_car.id).year).toEqual(2009);
      expect(cars.find(new_car.id).status).toEqual('new');
      expect(cars.objects.length).toEqual(4);
      return expect(cars.dirty_object_count).toEqual(1);
    });
    it('can update existing objects by passing updated attributes as arguments', function() {
      var car;
      car = cars.find(1);
      car.update({
        make: "Toyota",
        model: "Supra",
        year: 2002
      });
      expect(cars.find(1).make).toEqual("Toyota");
      expect(cars.find(1).model).toEqual("Supra");
      expect(cars.find(1).year).toEqual(2002);
      expect(cars.find(1).status).toEqual('dirty');
      expect(cars.objects.length).toEqual(3);
      return expect(cars.dirty_object_count).toEqual(1);
    });
    it('can update new objects by passing updated attributes as arguments to static methods', function() {
      var new_car;
      new_car = cars.add({
        make: "Dodge",
        model: "Viper SRT-10",
        year: 2008
      });
      cars.update({
        id: new_car.id,
        make: "Lamborghini",
        model: "Murcielago",
        year: 2009
      });
      expect(cars.find(new_car.id).make).toEqual("Lamborghini");
      expect(cars.find(new_car.id).model).toEqual("Murcielago");
      expect(cars.find(new_car.id).year).toEqual(2009);
      expect(cars.find(new_car.id).status).toEqual('new');
      expect(cars.objects.length).toEqual(4);
      return expect(cars.dirty_object_count).toEqual(1);
    });
    it('can update existing objects by passing updated attributes as arguments to static methods', function() {
      var car;
      car = cars.find(1);
      cars.update({
        id: car.id,
        make: "Toyota",
        model: "Supra",
        year: 2002
      });
      expect(cars.find(1).make).toEqual("Toyota");
      expect(cars.find(1).model).toEqual("Supra");
      expect(cars.find(1).year).toEqual(2002);
      expect(cars.find(1).status).toEqual('dirty');
      expect(cars.objects.length).toEqual(3);
      return expect(cars.dirty_object_count).toEqual(1);
    });
    it('only accepts updates for pre-defined attributes on objects', function() {
      var car;
      car = cars.find(1);
      car.update({
        make: "Toyota",
        model: "Supra",
        year: 2002,
        trim: "GTS"
      });
      expect(cars.find(1).make).toEqual("Toyota");
      expect(cars.find(1).model).toEqual("Supra");
      expect(cars.find(1).year).toEqual(2002);
      expect(cars.find(1).trim).toBeUndefined();
      expect(cars.find(1).status).toEqual('dirty');
      expect(cars.objects.length).toEqual(3);
      return expect(cars.dirty_object_count).toEqual(1);
    });
    it('does not accept updates to id attributes on objects', function() {
      var car;
      car = cars.find(1);
      car.update({
        id: 213,
        make: "Toyota",
        model: "Supra",
        year: 2002,
        trim: "GTS"
      });
      expect(cars.find(1).id).toEqual(1);
      expect(cars.find(1).make).toEqual("Toyota");
      expect(cars.find(1).model).toEqual("Supra");
      expect(cars.find(1).year).toEqual(2002);
      expect(cars.find(1).trim).toBeUndefined();
      expect(cars.find(1).status).toEqual('dirty');
      expect(cars.objects.length).toEqual(3);
      return expect(cars.dirty_object_count).toEqual(1);
    });
    it('can update new sub-objects by passing updated attributes as arguments', function() {
      var car, new_part;
      car = cars.find(1);
      new_part = car.parts.add({
        name: "Exhaust Manifold",
        price: 249.99
      });
      new_part.update({
        name: "Intake Filter",
        price: 19.99
      });
      expect(car.parts.find(new_part.id).name).toEqual("Intake Filter");
      expect(car.parts.find(new_part.id).price).toEqual(19.99);
      expect(car.status).toEqual('dirty');
      expect(cars.objects.length).toEqual(3);
      expect(car.parts.length).toEqual(3);
      expect(cars.dirty_object_count).toEqual(1);
      return expect(new_part.status).toEqual("new");
    });
    it('can update existing sub-objects by passing updated attributes as arguments', function() {
      var car, part;
      car = cars.find(1);
      part = car.parts.find(1);
      part.update({
        name: "Exhaust Manifold",
        price: 249.99
      });
      expect(car.parts.find(1).name).toEqual("Exhaust Manifold");
      expect(car.parts.find(1).price).toEqual(249.99);
      expect(cars.find(1).status).toEqual('dirty');
      expect(cars.objects.length).toEqual(3);
      expect(car.parts.length).toEqual(2);
      return expect(cars.dirty_object_count).toEqual(1);
    });
    it('only accepts updates for pre-defined attributes on sub-objects', function() {
      var car, part;
      car = cars.find(1);
      part = car.parts.find(1);
      part.update({
        name: "Exhaust Manifold",
        price: 249.99,
        condition: "used"
      });
      expect(car.parts.find(1).name).toEqual("Exhaust Manifold");
      expect(car.parts.find(1).price).toEqual(249.99);
      expect(car.parts.find(1).condition).toBeUndefined();
      expect(cars.find(1).status).toEqual('dirty');
      expect(cars.objects.length).toEqual(3);
      expect(car.parts.length).toEqual(2);
      return expect(cars.dirty_object_count).toEqual(1);
    });
    it('does not accept updates to id attributes on sub-objects', function() {
      var car, part;
      car = cars.find(1);
      part = car.parts.find(1);
      part.update({
        id: 213,
        name: "Exhaust Manifold",
        price: 249.99
      });
      expect(car.parts.find(1).id).toEqual(1);
      expect(car.parts.find(1).name).toEqual("Exhaust Manifold");
      expect(car.parts.find(1).price).toEqual(249.99);
      expect(car.parts.find(1).condition).toBeUndefined();
      expect(cars.find(1).status).toEqual('dirty');
      expect(cars.objects.length).toEqual(3);
      expect(car.parts.length).toEqual(2);
      return expect(cars.dirty_object_count).toEqual(1);
    });
    it('is storing objects after updating', function() {
      var car;
      car = cars.find(1);
      car.make = "Toyota";
      car.model = "Supra";
      car.year = 2002;
      car.update();
      expect(cars.load).toBeTruthy();
      expect(cars.objects.length).toEqual(3);
      return expect(cars.dirty_object_count).toEqual(1);
    });
    it('can strip new objects', function() {
      var key, new_car, stripped_object, value;
      new_car = cars.add({
        make: "Dodge",
        model: "Viper SRT-10",
        year: 2008
      });
      stripped_object = cars.strip(new_car);
      for (key in stripped_object) {
        value = stripped_object[key];
        expect(['make', 'model', 'year', 'parts']).toContain(key);
      }
      expect(cars.objects.length).toEqual(4);
      return expect(cars.dirty_object_count).toEqual(1);
    });
    it('can strip new objects with a specified id', function() {
      var key, new_car, stripped_object, value;
      new_car = cars.add({
        make: "Dodge",
        model: "Viper SRT-10",
        year: 2008
      });
      stripped_object = cars.strip(new_car);
      for (key in stripped_object) {
        value = stripped_object[key];
        expect(['make', 'model', 'year', 'parts']).toContain(key);
      }
      expect(cars.objects.length).toEqual(4);
      return expect(cars.dirty_object_count).toEqual(1);
    });
    it('can strip existing objects', function() {
      var key, stripped_object, value;
      stripped_object = cars.strip(cars.find(3));
      for (key in stripped_object) {
        value = stripped_object[key];
        expect(['id', 'make', 'model', 'year', 'parts', 'dealers']).toContain(key);
      }
      expect(cars.objects.length).toEqual(3);
      return expect(cars.dirty_object_count).toEqual(0);
    });
    it('can strip new sub-objects', function() {
      var car, key, new_part, part, stripped_car, value, _i, _len, _ref, _ref2, _results;
      car = cars.find(3);
      new_part = car.parts.add({
        name: "Exhaust Manifold",
        price: 249.99
      });
      stripped_car = cars.strip(car);
      _ref = stripped_car.parts;
      for (key in _ref) {
        value = _ref[key];
        expect(['0']).toContain(key);
      }
      _ref2 = stripped_car.parts;
      _results = [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        part = _ref2[_i];
        _results.push((function() {
          var _results2;
          _results2 = [];
          for (key in part) {
            value = part[key];
            _results2.push(expect(['name', 'price']).toContain(key));
          }
          return _results2;
        })());
      }
      return _results;
    });
    it('can strip existing sub-objects', function() {
      var car, key, part, stripped_car, value, _i, _len, _ref, _ref2, _results;
      car = cars.find(1);
      stripped_car = cars.strip(car);
      _ref = stripped_car.parts;
      for (key in _ref) {
        value = _ref[key];
        expect(['0', '1']).toContain(key);
      }
      _ref2 = stripped_car.parts;
      _results = [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        part = _ref2[_i];
        _results.push((function() {
          var _results2;
          _results2 = [];
          for (key in part) {
            value = part[key];
            _results2.push(expect(['id', 'name', 'price']).toContain(key));
          }
          return _results2;
        })());
      }
      return _results;
    });
    it('can delete new objects via instances', function() {
      var new_car;
      new_car = cars.add({
        make: "Dodge",
        model: "Viper SRT-10",
        year: 2008
      });
      new_car["delete"]();
      expect(cars.objects.length).toEqual(3);
      return expect(cars.dirty_object_count).toEqual(0);
    });
    it('can delete new objects via methods', function() {
      var new_car;
      new_car = cars.add({
        id: 12,
        make: "Tesla",
        model: "Roadster",
        year: 2009
      });
      cars["delete"](12);
      expect(cars.objects.length).toEqual(3);
      return expect(cars.dirty_object_count).toEqual(0);
    });
    it('can delete existing objects via instances', function() {
      var car;
      car = cars.find(1);
      car["delete"]();
      expect(cars.objects.length).toEqual(3);
      expect(cars.dirty_object_count).toEqual(1);
      return expect(car.status).toEqual('deleted');
    });
    it('can delete existing objects via methods', function() {
      cars["delete"](3);
      expect(cars.objects.length).toEqual(3);
      expect(cars.dirty_object_count).toEqual(1);
      return expect(cars.find(3).status).toEqual('deleted');
    });
    it('can delete new sub-objects via instances', function() {
      var car, new_part;
      car = cars.find(3);
      new_part = car.parts.add({
        id: 12,
        name: "Windshield",
        year: 599.99
      });
      new_part["delete"]();
      expect(cars.objects.length).toEqual(3);
      expect(cars.dirty_object_count).toEqual(1);
      return expect(car.parts.length).toEqual(0);
    });
    it('can delete new sub-objects via methods', function() {
      var car, new_part;
      car = cars.find(3);
      new_part = car.parts.add({
        id: 12,
        name: "Windshield",
        year: 599.99
      });
      car.parts["delete"](12);
      expect(cars.objects.length).toEqual(3);
      expect(cars.dirty_object_count).toEqual(1);
      return expect(car.parts.length).toEqual(0);
    });
    it('can delete existing sub-objects via instances', function() {
      var car, new_part;
      car = cars.find(1);
      new_part = car.parts.find(2);
      new_part["delete"]();
      expect(cars.objects.length).toEqual(3);
      expect(cars.dirty_object_count).toEqual(1);
      expect(car.parts.length).toEqual(1);
      return expect(car.status).toEqual('dirty');
    });
    it('can delete existing sub-objects via methods', function() {
      var car;
      car = cars.find(1);
      car.parts["delete"](2);
      expect(cars.objects.length).toEqual(3);
      expect(cars.dirty_object_count).toEqual(1);
      expect(car.parts.length).toEqual(1);
      return expect(car.status).toEqual('dirty');
    });
    it('is storing objects after deleting', function() {
      cars["delete"](3);
      expect(cars.load).toBeTruthy();
      expect(cars.objects.length).toEqual(3);
      return expect(cars.dirty_object_count).toEqual(1);
    });
    it('can enumerate non-deleted objects', function() {
      var cars_visited;
      cars["delete"](3);
      cars_visited = 0;
      cars.each(function() {
        return cars_visited++;
      });
      expect(cars_visited).toEqual(2);
      expect(cars.objects.length).toEqual(3);
      return expect(cars.dirty_object_count).toEqual(1);
    });
    it('can destroy new objects using Vault methods', function() {
      var new_car;
      new_car = cars.add({
        id: 12,
        make: "Tesla",
        model: "Roadster",
        year: 2009
      });
      cars.destroy(12);
      expect(cars.objects.length).toEqual(3);
      return expect(cars.dirty_object_count).toEqual(0);
    });
    it('can destroy existing objects using Vault methods', function() {
      cars.destroy(3);
      expect(cars.objects.length).toEqual(2);
      expect(cars.dirty_object_count).toEqual(0);
      return expect(cars.find(3)).toBeFalsy();
    });
    it('can destroy new objects using Vault object methods', function() {
      var new_car;
      new_car = cars.add({
        id: 12,
        make: "Tesla",
        model: "Roadster",
        year: 2009
      });
      new_car.destroy();
      expect(cars.objects.length).toEqual(3);
      return expect(cars.dirty_object_count).toEqual(0);
    });
    it('can destroy existing objects using Vault object methods', function() {
      cars.find(3).destroy();
      expect(cars.objects.length).toEqual(2);
      expect(cars.dirty_object_count).toEqual(0);
      return expect(cars.find(3)).toBeFalsy();
    });
    it('can save individual objects properly', function() {
      var car, new_car;
      new_car = cars.add({
        make: "Dodge",
        model: "Viper SRT-10",
        year: 2008
      });
      car = cars.find(1);
      car.make = "Toyota";
      car.model = "Supra";
      car.year = 2002;
      car.update();
      expect(cars.objects.length).toEqual(4);
      expect(cars.dirty_object_count).toEqual(2);
      return car.save(function() {
        expect(cars.objects.length).toEqual(4);
        return expect(cars.dirty_object_count).toEqual(1);
      });
    });
    it('is storing objects after save', function() {
      var new_car;
      new_car = cars.add({
        make: "Dodge",
        model: "Viper SRT-10",
        year: 2008
      });
      expect(cars.locked).toBeFalsy();
      expect(cars.load).toBeTruthy();
      return cars.save(function() {
        expect(cars.objects.length).toEqual(4);
        return expect(cars.dirty_object_count).toEqual(0);
      });
    });
    it('can reload objects', function() {
      var new_car;
      new_car = cars.add({
        make: "Dodge",
        model: "Viper SRT-10",
        year: 2008
      });
      cars.reload(function() {
        expect(cars.objects.length).toEqual(3);
        return expect(cars.dirty_object_count).toEqual(0);
      });
      return waitsFor(function() {
        return !cars.locked;
      });
    });
    it('is refreshing stored objects after a reload', function() {
      var new_car;
      new_car = cars.add({
        make: "Dodge",
        model: "Viper SRT-10",
        year: 2008
      });
      cars.reload(function() {
        expect(cars.load).toBeTruthy();
        expect(cars.objects.length).toEqual(3);
        return expect(cars.dirty_object_count).toEqual(0);
      });
      return waitsFor(function() {
        return !cars.locked;
      });
    });
    it('is extending stored objects after a reload', function() {
      cars.find(1).update();
      cars.store();
      cars = new Vault('cars', urls, {
        offline: true,
        sub_collections: ['parts', 'dealers']
      });
      waitsFor(function() {
        return !cars.locked;
      });
      expect(cars.find(1).update).toBeDefined();
      return expect(cars.find(1)["delete"]).toBeDefined();
    });
    it('is extending stored sub-collections after a reload', function() {
      cars.find(1).update();
      cars.store();
      cars = new Vault('cars', urls, {
        offline: true,
        sub_collections: ['parts', 'dealers']
      });
      waitsFor(function() {
        return !cars.locked;
      });
      expect(cars.find(1).parts.find).toBeDefined();
      expect(cars.find(1).parts.add).toBeDefined();
      return expect(cars.find(1).parts["delete"]).toBeDefined();
    });
    it('is extending stored sub-objects after a reload', function() {
      var dealer, part;
      cars.find(1).update();
      cars.store();
      cars = new Vault('cars', urls, {
        offline: true,
        sub_collections: ['parts', 'dealers']
      });
      waitsFor(function() {
        return !cars.locked;
      });
      part = cars.parts.find(3);
      dealer = cars.dealers.find(1);
      expect(part.update).toBeDefined();
      expect(part["delete"]).toBeDefined();
      expect(dealer.update).toBeDefined();
      return expect(dealer["delete"]).toBeDefined();
    });
    return it("doesn't bother storing an empty collection", function() {
      var test;
      test = new Vault('test', {
        offline: true
      });
      waitsFor(function() {
        return !test.locked;
      });
      expect(localStorage.test != null).toBeFalsy();
      test.store();
      return expect(localStorage.test != null).toBeFalsy();
    });
  });
}).call(this);
