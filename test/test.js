var urls = {
    list: "test.json"
}
var cars = new Vault('cars', urls, {after_load: function() {
    var new_car, existing_car;
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

        it('can read objects', function () {
            expect(cars.fetch(new_car.id).model).toEqual("Viper SRT-10");
        });

        it('can update new objects', function () {
            new_car.year = 2009;
            new_car.update();

            expect(cars.fetch(new_car.id).year).toEqual(2009);
            expect(cars.fetch(new_car.id).status).toEqual('new');
            expect(cars.objects.length).toEqual(4);
        });

        it('can update existing objects', function () {
            var mustang = cars.fetch(1);
            mustang.year = 2011;
            mustang.update();

            expect(cars.fetch(1).year).toEqual(2011);
            expect(cars.fetch(1).status).toEqual('dirty');
            expect(cars.objects.length).toEqual(4);
        });

        it('can remove new objects', function () {
            new_car.delete();

            expect(cars.objects.length).toEqual(3);
        });

        it('can remove existing objects', function () {
            var mustang = cars.fetch(1);
            mustang.delete();

            expect(cars.objects.length).toEqual(3);
            expect(mustang.status).toEqual('deleted');
        });
    });
}});