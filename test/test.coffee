urls =
  list: "test.json"

describe 'Vault', ->
  # Setup a new, fresh Vault for every test.
  cars = null
  beforeEach ->
    cars = new Vault 'cars', urls,
      offline: true
      sub_collections: ['parts']
    waitsFor ->
      not cars.locked
  
  it 'can load objects', ->
    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(0)

  it 'can store objects', ->
    expect(cars.store).toBeTruthy()

  it 'can enumerate objects', ->
    cars_visited = 0
    cars.each ->
      cars_visited++
    
    expect(cars_visited).toEqual(3)
  
  it 'can find top-level objects', ->
    car = cars.find(1)
    
    expect(car.model).toEqual("Shelby Mustang GT500")
  
  it 'can find second-level objects', ->
    car = cars.find(2)
    part = car.parts.find(3)
    
    expect(part.name).toEqual("Turbocharger")

  it 'can add objects', ->
    new_car = cars.add
      make: "Dodge",
      model: "Viper SRT-10",
      year: 2008

    expect(cars.objects.length).toEqual(4)
    expect(cars.dirty_object_count).toEqual(1)

  it 'can add objects with a specified id', ->
    new_car = cars.add
      id: 12,
      make: "Tesla",
      model: "Roadster",
      year: 2009

    expect(cars.objects.length).toEqual(4)
    expect(cars.dirty_object_count).toEqual(1)

  it 'can add second-level objects', ->
    car = cars.find(2)
    new_part = car.parts.add
      name: "Intercooler",
      year: 259.99

    expect(car.parts.length).toEqual(2)
    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(1)

  it 'can add second-level objects with a specified id', ->
    car = cars.find(1)
    new_part_2 = car.parts.add
      id: 12,
      make: "ECU",
      year: 189.99

    expect(car.parts.length).toEqual(3)
    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(1)

  it 'is storing objects after adding', ->
    new_car = cars.add
      id: 12,
      make: "Tesla",
      model: "Roadster",
      year: 2009
    expect(cars.load).toBeTruthy()

    expect(cars.objects.length).toEqual(4)
    expect(cars.dirty_object_count).toEqual(1)

  it 'can read new objects', ->
    new_car = cars.add
      make: "Dodge",
      model: "Viper SRT-10",
      year: 2008
    
    expect(cars.find(new_car.id).model).toEqual("Viper SRT-10")

  it 'can read new objects with a specified id', ->
    new_car = cars.add
      id: 12,
      make: "Tesla",
      model: "Roadster",
      year: 2009
    
    expect(cars.find(12).model).toEqual("Roadster")

  it 'can read existing objects', ->
    expect(cars.find(2).model).toEqual("Lancer Evolution X")

  it 'can update new objects via instances', ->
    new_car = cars.add
      make: "Dodge",
      model: "Viper SRT-10",
      year: 2008
    
    new_car.make = "Lamborghini"
    new_car.model = "Murcielago"
    new_car.year = 2009
    new_car.update()

    expect(cars.find(new_car.id).make).toEqual("Lamborghini")
    expect(cars.find(new_car.id).model).toEqual("Murcielago")
    expect(cars.find(new_car.id).year).toEqual(2009)
    expect(cars.find(new_car.id).status).toEqual('new')
    expect(cars.objects.length).toEqual(4)
    expect(cars.dirty_object_count).toEqual(1)

  it 'can update existing objects via instances', ->
    car = cars.find(1)
    car.make = "Toyota"
    car.model = "Supra"
    car.year = 2002
    car.update()

    expect(cars.find(1).make).toEqual("Toyota")
    expect(cars.find(1).model).toEqual("Supra")
    expect(cars.find(1).year).toEqual(2002)
    expect(cars.find(1).status).toEqual('dirty')
    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(1)

  it 'is storing objects after updating', ->
    car = cars.find(1)
    car.make = "Toyota"
    car.model = "Supra"
    car.year = 2002
    car.update()
    
    expect(cars.load).toBeTruthy()

    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(1)

  it 'can strip new objects', ->
    new_car = cars.add
      make: "Dodge",
      model: "Viper SRT-10",
      year: 2008
    stripped_object = cars.strip(new_car)

    for key, value of stripped_object
      expect(['make', 'model', 'year', 'parts']).toContain key
    expect(cars.objects.length).toEqual(4)
    expect(cars.dirty_object_count).toEqual(1)

  it 'can strip new objects with a specified id', ->
    new_car = cars.add
      make: "Dodge",
      model: "Viper SRT-10",
      year: 2008
    stripped_object = cars.strip(new_car)

    for key, value of stripped_object
      expect(['make', 'model', 'year', 'parts']).toContain key
    expect(cars.objects.length).toEqual(4)
    expect(cars.dirty_object_count).toEqual(1)

  it 'can strip existing objects', ->
    stripped_object = cars.strip(cars.find(3))

    for key, value of stripped_object
      expect(['id', 'make', 'model', 'year', 'parts']).toContain key
    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(0)

  it 'can remove new objects via instances', ->
    new_car = cars.add
      make: "Dodge",
      model: "Viper SRT-10",
      year: 2008
    new_car.delete()

    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(0)

  it 'can remove new objects via methods', ->
    new_car = cars.add
      id: 12,
      make: "Tesla",
      model: "Roadster",
      year: 2009
    cars.delete(12)

    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(0)

  it 'can remove existing objects via instances', ->
    car = cars.find(1)
    car.delete()

    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(1)
    expect(car.status).toEqual('deleted')

  it 'can remove existing objects via methods', ->
    cars.delete(3)

    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(1)
    expect(cars.find(3).status).toEqual('deleted')

  it 'is storing objects after deleting', ->
    cars.delete(3)
    expect(cars.load).toBeTruthy()

    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(1)

  it 'can enumerate non-deleted objects', ->
    cars.delete(3)
    cars_visited = 0
    cars.each ->
      cars_visited++
    expect(cars_visited).toEqual(2)
    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(1)

  it 'can save properly', ->
    new_car = cars.add
      make: "Dodge",
      model: "Viper SRT-10",
      year: 2008
      
    car = cars.find(1)
    car.make = "Toyota"
    car.model = "Supra"
    car.year = 2002
    car.update()
    
    expect(cars.objects.length).toEqual(4)
    expect(cars.dirty_object_count).toEqual(2)
    
    cars.save ->
      expect(cars.objects.length).toEqual(4)
      expect(cars.dirty_object_count).toEqual(0)

  it 'is storing objects after save', ->
    new_car = cars.add
      make: "Dodge",
      model: "Viper SRT-10",
      year: 2008
    expect(cars.locked).toBeFalsy()
    expect(cars.load).toBeTruthy()
    
    cars.save ->
      expect(cars.objects.length).toEqual(4)
      expect(cars.dirty_object_count).toEqual(0)

  it 'can reload objects', ->
    new_car = cars.add
      make: "Dodge",
      model: "Viper SRT-10",
      year: 2008
    
    cars.reload ->
      expect(cars.objects.length).toEqual(3)
      expect(cars.dirty_object_count).toEqual(0)
    
    # Prevent other tests from running until this is complete.
    waitsFor ->
      not cars.locked

  it 'is refreshing stored objects after a reload', ->
    new_car = cars.add
      make: "Dodge",
      model: "Viper SRT-10",
      year: 2008
    
    cars.reload ->
      # The new car should be gone from the offline cache.
      expect(cars.load).toBeTruthy()
      expect(cars.objects.length).toEqual(3)
      expect(cars.dirty_object_count).toEqual(0)
    
    # Prevent other tests from running until this is complete.
    waitsFor ->
      not cars.locked
