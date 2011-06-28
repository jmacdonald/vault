var mustang, evo, cars;
$(document).ready(function() {
    var urls = {
        list: "test.json"
    }
    cars = new Vault('cars', urls, {after_load: function() {

        // Add a Viper.
        cars.add({
            make: "Dodge",
            model: "Viper SRT-10",
            year: 2008
        });

        // Update the Evo's year.
        evo = cars.fetch(2);
        evo.year = 2011;
        evo.update();

        // Get rid of the Mustang.
        mustang = cars.fetch(1);
        mustang.delete();

        // Log the cars to the console.
        console.log(cars.objects);
    }});
});