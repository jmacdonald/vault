var urls = {
    list: "test.json"
}
var cars = new Vault('cars', urls, {after_load: function() {
    var new_car, new_car_2, existing_car;
    describe('Vault', function () {
        it('can load objects', function () {
            expect(cars.objects.length).toEqual(3);
        });

        it('can add objects', function () {
            new_car = cars.add({
                make: "Dodge",
                model: "Viper SRT-10",
                year: 2008
            });
            expect(cars.objects.length).toEqual(4);
        });

        it('can add objects with a specified id', function () {
            new_car_2 = cars.add({
                id: 12,
                make: "Tesla",
                model: "Roadster",
                year: 2009
            });
            expect(cars.objects.length).toEqual(5);
        });

        it('can read new objects', function () {
            expect(cars.fetch(new_car.id).model).toEqual("Viper SRT-10");
        });

        it('can read new objects with a specified id', function () {
            expect(cars.fetch(12).model).toEqual("Roadster");
        });

        it('can read existing objects', function () {
            expect(cars.fetch(2).model).toEqual("Lancer Evolution X");
        });

        it('can update new objects via instances', function () {
            new_car.make = "Lamborghini";
            new_car.model = "Murcielago";
            new_car.year = 2009;
            new_car.update();

            expect(cars.fetch(new_car.id).make).toEqual("Lamborghini");
            expect(cars.fetch(new_car.id).model).toEqual("Murcielago");
            expect(cars.fetch(new_car.id).year).toEqual(2009);
            expect(cars.fetch(new_car.id).status).toEqual('new');
            expect(cars.objects.length).toEqual(5);
        });

        it('can update new objects via method', function () {
            cars.update({
                id: new_car.id,
                make: "Subaru",
                model: "Impreza WRX STI",
                year: 2011
            });

            expect(cars.fetch(new_car.id).make).toEqual("Subaru");
            expect(cars.fetch(new_car.id).model).toEqual("Impreza WRX STI");
            expect(cars.fetch(new_car.id).year).toEqual(2011);
            expect(cars.fetch(new_car.id).status).toEqual('new');
            expect(cars.objects.length).toEqual(5);
        });

        it('can update existing objects via instances', function () {
            var car = cars.fetch(1);
            car.make = "Toyota";
            car.model = "Supra";
            car.year = 2002;
            car.update();

            expect(cars.fetch(1).make).toEqual("Toyota");
            expect(cars.fetch(1).model).toEqual("Supra");
            expect(cars.fetch(1).year).toEqual(2002);
            expect(cars.fetch(1).status).toEqual('dirty');
            expect(cars.objects.length).toEqual(5);
        });

        it('can update existing objects via method', function () {
            cars.update({
                id: 3,
                make: "Honda",
                model: "NSX",
                year: 2005
            });

            expect(cars.fetch(3).make).toEqual("Honda");
            expect(cars.fetch(3).model).toEqual("NSX");
            expect(cars.fetch(3).year).toEqual(2005);
            expect(cars.fetch(3).status).toEqual('dirty');
            expect(cars.objects.length).toEqual(5);
        });

        it('can remove new objects via instances', function () {
            new_car.delete();

            expect(cars.objects.length).toEqual(4);
        });

        it('can remove new objects via methods', function () {
            cars.delete(12);

            expect(cars.objects.length).toEqual(3);
        });

        it('can remove existing objects via instances', function () {
            var car = cars.fetch(1);
            car.delete();

            expect(cars.objects.length).toEqual(3);
            expect(car.status).toEqual('deleted');
        });

        it('can remove existing objects via methods', function () {
            cars.delete(3);

            expect(cars.objects.length).toEqual(3);
            expect(cars.fetch(3).status).toEqual('deleted');
        });
    });
}});