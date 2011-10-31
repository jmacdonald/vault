(function() {
  var cars, new_car, new_car_2, urls;
  urls = {
    list: "test.json"
  };
  new_car = new_car_2 = null;
  cars = new Vault('cars', urls, {
    offline: true,
    after_load: function() {
      return describe('Vault', function() {
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
        it('can add objects', function() {
          new_car = cars.add({
            make: "Dodge",
            model: "Viper SRT-10",
            year: 2008
          });
          expect(cars.objects.length).toEqual(4);
          return expect(cars.dirty_object_count).toEqual(1);
        });
        it('can add objects with a specified id', function() {
          new_car_2 = cars.add({
            id: 12,
            make: "Tesla",
            model: "Roadster",
            year: 2009
          });
          expect(cars.objects.length).toEqual(5);
          return expect(cars.dirty_object_count).toEqual(2);
        });
        it('is storing objects after adding', function() {
          expect(cars.load).toBeTruthy();
          expect(cars.objects.length).toEqual(5);
          return expect(cars.dirty_object_count).toEqual(2);
        });
        it('can read new objects', function() {
          return expect(cars.find(new_car.id).model).toEqual("Viper SRT-10");
        });
        it('can read new objects with a specified id', function() {
          return expect(cars.find(12).model).toEqual("Roadster");
        });
        it('can read existing objects', function() {
          return expect(cars.find(2).model).toEqual("Lancer Evolution X");
        });
        it('can update new objects via instances', function() {
          new_car.make = "Lamborghini";
          new_car.model = "Murcielago";
          new_car.year = 2009;
          new_car.update();
          expect(cars.find(new_car.id).make).toEqual("Lamborghini");
          expect(cars.find(new_car.id).model).toEqual("Murcielago");
          expect(cars.find(new_car.id).year).toEqual(2009);
          expect(cars.find(new_car.id).status).toEqual('new');
          expect(cars.objects.length).toEqual(5);
          return expect(cars.dirty_object_count).toEqual(2);
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
          expect(cars.objects.length).toEqual(5);
          return expect(cars.dirty_object_count).toEqual(3);
        });
        it('is storing objects after updating', function() {
          expect(cars.load).toBeTruthy();
          expect(cars.objects.length).toEqual(5);
          return expect(cars.dirty_object_count).toEqual(3);
        });
        it('can strip new objects', function() {
          var key, stripped_object, value;
          stripped_object = cars.strip(new_car);
          for (key in stripped_object) {
            value = stripped_object[key];
            expect(['make', 'model', 'year']).toContain(key);
          }
          expect(cars.objects.length).toEqual(5);
          return expect(cars.dirty_object_count).toEqual(3);
        });
        it('can strip new objects with a specified id', function() {
          var key, stripped_object, value;
          stripped_object = cars.strip(new_car_2);
          for (key in stripped_object) {
            value = stripped_object[key];
            expect(['make', 'model', 'year']).toContain(key);
          }
          expect(cars.objects.length).toEqual(5);
          return expect(cars.dirty_object_count).toEqual(3);
        });
        it('can strip existing objects', function() {
          var key, stripped_object, value;
          stripped_object = cars.strip(cars.find(3));
          for (key in stripped_object) {
            value = stripped_object[key];
            expect(['id', 'make', 'model', 'year']).toContain(key);
          }
          expect(cars.objects.length).toEqual(5);
          return expect(cars.dirty_object_count).toEqual(3);
        });
        it('can remove new objects via instances', function() {
          new_car["delete"]();
          expect(cars.objects.length).toEqual(4);
          return expect(cars.dirty_object_count).toEqual(2);
        });
        it('can remove new objects via methods', function() {
          cars["delete"](12);
          expect(cars.objects.length).toEqual(3);
          return expect(cars.dirty_object_count).toEqual(1);
        });
        it('can remove existing objects via instances', function() {
          var car;
          car = cars.find(1);
          car["delete"]();
          expect(cars.objects.length).toEqual(3);
          expect(cars.dirty_object_count).toEqual(1);
          return expect(car.status).toEqual('deleted');
        });
        it('can remove existing objects via methods', function() {
          cars["delete"](3);
          expect(cars.objects.length).toEqual(3);
          expect(cars.dirty_object_count).toEqual(2);
          return expect(cars.find(3).status).toEqual('deleted');
        });
        it('is storing objects after deleting', function() {
          expect(cars.load).toBeTruthy();
          expect(cars.objects.length).toEqual(3);
          return expect(cars.dirty_object_count).toEqual(2);
        });
        it('can enumerate non-deleted objects', function() {
          var cars_visited;
          cars_visited = 0;
          cars.each(function() {
            return cars_visited++;
          });
          expect(cars_visited).toEqual(1);
          expect(cars.objects.length).toEqual(3);
          return expect(cars.dirty_object_count).toEqual(2);
        });
        it('can save properly', function() {
          return cars.save(function() {
            expect(cars.objects.length).toEqual(1);
            return expect(cars.dirty_object_count).toEqual(0);
          });
        });
        it('is storing objects after save', function() {
          waitsFor(function() {
            return !cars.locked;
          });
          return runs(function() {
            expect(cars.locked).toBeFalsy();
            expect(cars.load).toBeTruthy();
            expect(cars.objects.length).toEqual(1);
            return expect(cars.dirty_object_count).toEqual(0);
          });
        });
        it('can reload objects', function() {
          waitsFor(function() {
            return !cars.locked;
          });
          return runs(function() {
            return cars.reload(function() {
              expect(cars.objects.length).toEqual(3);
              return expect(cars.dirty_object_count).toEqual(0);
            });
          });
        });
        return it('is storing objects after reload', function() {
          waitsFor(function() {
            return !cars.locked;
          });
          return runs(function() {
            expect(cars.load).toBeTruthy();
            expect(cars.objects.length).toEqual(3);
            return expect(cars.dirty_object_count).toEqual(0);
          });
        });
      });
    }
  });
}).call(this);
