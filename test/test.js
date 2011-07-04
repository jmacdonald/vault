(function() {
  var cars, new_car, new_car_2, urls;
  urls = {
    list: "test.json"
  };
  new_car = new_car_2 = null;
  cars = new Vault('cars', urls, {
    after_load: function() {
      return describe('Vault', function() {
        it('can load objects', function() {
          return expect(cars.objects.length).toEqual(3);
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
        it('can read new objects', function() {
          return expect(cars.fetch(new_car.id).model).toEqual("Viper SRT-10");
        });
        it('can read new objects with a specified id', function() {
          return expect(cars.fetch(12).model).toEqual("Roadster");
        });
        it('can read existing objects', function() {
          return expect(cars.fetch(2).model).toEqual("Lancer Evolution X");
        });
        it('can update new objects via instances', function() {
          new_car.make = "Lamborghini";
          new_car.model = "Murcielago";
          new_car.year = 2009;
          new_car.update();
          expect(cars.fetch(new_car.id).make).toEqual("Lamborghini");
          expect(cars.fetch(new_car.id).model).toEqual("Murcielago");
          expect(cars.fetch(new_car.id).year).toEqual(2009);
          expect(cars.fetch(new_car.id).status).toEqual('new');
          expect(cars.objects.length).toEqual(5);
          return expect(cars.dirty_object_count).toEqual(2);
        });
        it('can update existing objects via instances', function() {
          var car;
          car = cars.fetch(1);
          car.make = "Toyota";
          car.model = "Supra";
          car.year = 2002;
          car.update();
          expect(cars.fetch(1).make).toEqual("Toyota");
          expect(cars.fetch(1).model).toEqual("Supra");
          expect(cars.fetch(1).year).toEqual(2002);
          expect(cars.fetch(1).status).toEqual('dirty');
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
          return expect(cars.objects.length).toEqual(5);
        });
        it('can strip new objects with a specified id', function() {
          var key, stripped_object, value;
          stripped_object = cars.strip(new_car_2);
          for (key in stripped_object) {
            value = stripped_object[key];
            expect(['make', 'model', 'year']).toContain(key);
          }
          return expect(cars.objects.length).toEqual(5);
        });
        it('can strip existing objects', function() {
          var key, stripped_object, value;
          stripped_object = cars.strip(cars.fetch(3));
          for (key in stripped_object) {
            value = stripped_object[key];
            expect(['id', 'make', 'model', 'year']).toContain(key);
          }
          return expect(cars.objects.length).toEqual(5);
        });
        it('can remove new objects via instances', function() {
          new_car["delete"]();
          return expect(cars.objects.length).toEqual(4);
        });
        it('can remove new objects via methods', function() {
          cars["delete"](12);
          return expect(cars.objects.length).toEqual(3);
        });
        it('can remove existing objects via instances', function() {
          var car;
          car = cars.fetch(1);
          car["delete"]();
          expect(cars.objects.length).toEqual(3);
          return expect(car.status).toEqual('deleted');
        });
        it('can remove existing objects via methods', function() {
          cars["delete"](3);
          expect(cars.objects.length).toEqual(3);
          return expect(cars.fetch(3).status).toEqual('deleted');
        });
        it('can enumerate non-deleted objects', function() {
          var cars_visited;
          cars_visited = 0;
          cars.each(function() {
            return cars_visited++;
          });
          return expect(cars_visited).toEqual(1);
        });
        return it('can synchronize properly', function() {
          return cars.synchronize(function() {
            return expect(cars.objects.length).toEqual(1);
          });
        });
      });
    }
  });
}).call(this);
