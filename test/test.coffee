urls =
  list: "test.json"

new_car = new_car_2 = null

cars = new Vault 'cars', urls,
  after_load: ->
    describe 'Vault', ->
      it 'can load objects', ->
        expect(cars.objects.length).toEqual(3)

      it 'can add objects', ->
        new_car = cars.add
          make: "Dodge",
          model: "Viper SRT-10",
          year: 2008

        expect(cars.objects.length).toEqual(4)

      it 'can add objects with a specified id', ->
        new_car_2 = cars.add
          id: 12,
          make: "Tesla",
          model: "Roadster",
          year: 2009

        expect(cars.objects.length).toEqual(5)

      it 'can read new objects', ->
        expect(cars.fetch(new_car.id).model).toEqual("Viper SRT-10")

      it 'can read new objects with a specified id', ->
        expect(cars.fetch(12).model).toEqual("Roadster")

      it 'can read existing objects', ->
        expect(cars.fetch(2).model).toEqual("Lancer Evolution X")

      it 'can update new objects via instances', ->
        new_car.make = "Lamborghini"
        new_car.model = "Murcielago"
        new_car.year = 2009
        new_car.update()

        expect(cars.fetch(new_car.id).make).toEqual("Lamborghini")
        expect(cars.fetch(new_car.id).model).toEqual("Murcielago")
        expect(cars.fetch(new_car.id).year).toEqual(2009)
        expect(cars.fetch(new_car.id).status).toEqual('new')
        expect(cars.objects.length).toEqual(5)

      it 'can update new objects via method', ->
        cars.update
          id: new_car.id,
          make: "Subaru",
          model: "Impreza WRX STI",
          year: 2011

        expect(cars.fetch(new_car.id).make).toEqual("Subaru")
        expect(cars.fetch(new_car.id).model).toEqual("Impreza WRX STI")
        expect(cars.fetch(new_car.id).year).toEqual(2011)
        expect(cars.fetch(new_car.id).status).toEqual('new')
        expect(cars.objects.length).toEqual(5)

      it 'can update existing objects via instances', ->
        car = cars.fetch(1)
        car.make = "Toyota"
        car.model = "Supra"
        car.year = 2002
        car.update()

        expect(cars.fetch(1).make).toEqual("Toyota")
        expect(cars.fetch(1).model).toEqual("Supra")
        expect(cars.fetch(1).year).toEqual(2002)
        expect(cars.fetch(1).status).toEqual('dirty')
        expect(cars.objects.length).toEqual(5)

      it 'can update existing objects via method', ->
        cars.update
          id: 3,
          make: "Honda",
          model: "NSX",
          year: 2005

        expect(cars.fetch(3).make).toEqual("Honda")
        expect(cars.fetch(3).model).toEqual("NSX")
        expect(cars.fetch(3).year).toEqual(2005)
        expect(cars.fetch(3).status).toEqual('dirty')
        expect(cars.objects.length).toEqual(5)

      it 'can strip new objects', ->
        stripped_object = cars.strip(new_car)

        for key, value of stripped_object
          expect(['make', 'model', 'year']).toContain key
        expect(cars.objects.length).toEqual(5)

      it 'can strip new objects with a specified id', ->
        stripped_object = cars.strip(new_car_2)

        for key, value of stripped_object
          expect(['make', 'model', 'year']).toContain key
        expect(cars.objects.length).toEqual(5)

      it 'can strip existing objects', ->
        stripped_object = cars.strip(cars.fetch(3))

        for key, value of stripped_object
          expect(['id', 'make', 'model', 'year']).toContain key
        expect(cars.objects.length).toEqual(5)

      it 'can remove new objects via instances', ->
        new_car.delete()

        expect(cars.objects.length).toEqual(4)

      it 'can remove new objects via methods', ->
        cars.delete(12)

        expect(cars.objects.length).toEqual(3)

      it 'can remove existing objects via instances', ->
        car = cars.fetch(1)
        car.delete()

        expect(cars.objects.length).toEqual(3)
        expect(car.status).toEqual('deleted')

      it 'can remove existing objects via methods', ->
        cars.delete(3)

        expect(cars.objects.length).toEqual(3)
        expect(cars.fetch(3).status).toEqual('deleted')