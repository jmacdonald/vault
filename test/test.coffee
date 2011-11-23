urls =
  list: "test.json"

describe 'Vault', ->
  # Setup a new, fresh Vault for every test.
  cars = null
  beforeEach ->
    localStorage.clear()
    cars = new Vault 'cars', urls,
      offline: true
      sub_collections: ['parts', 'dealers']
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
  
  it 'can find second-level objects using the convenience class', ->
    part = cars.parts.find(3)
    dealer = cars.dealers.find(1)
    
    expect(part.name).toEqual("Turbocharger")
    expect(dealer.name).toEqual("Super Car Mart")
  
  it 'can find second-level objects', ->
    car = cars.find(2)
    part = car.parts.find(3)
    
    expect(part.name).toEqual("Turbocharger")
  
  it 'can find top-level objects using a string-based id', ->
    car = cars.find("1")
    
    expect(car.model).toEqual("Shelby Mustang GT500")
  
  it 'can find second-level objects using the convenience class and a string-based id', ->
    part = cars.parts.find("3")
    dealer = cars.dealers.find("1")
    
    expect(part.name).toEqual("Turbocharger")
    expect(dealer.name).toEqual("Super Car Mart")
  
  it 'can find second-level objects using a string-based id', ->
    car = cars.find("2")
    part = car.parts.find("3")
    
    expect(part.name).toEqual("Turbocharger")
  
  it 'always returns false when trying to find a non-existent object', ->
    car = cars.find(99)
    part = cars.parts.find(99)
    dealer = cars.find(1).dealers.find(99)

    expect(car).toEqual(false)
    expect(part).toEqual(false)
    expect(dealer).toEqual(false)

  it 'can add objects', ->
    new_car = cars.add
      make: "Dodge",
      model: "Viper SRT-10",
      year: 2008

    expect(cars.objects.length).toEqual(4)
    expect(cars.dirty_object_count).toEqual(1)
    expect(new_car.status).toEqual("new")

  it 'can add objects with a specified id', ->
    new_car = cars.add
      id: 12,
      make: "Tesla",
      model: "Roadster",
      year: 2009

    expect(cars.objects.length).toEqual(4)
    expect(cars.dirty_object_count).toEqual(1)
    expect(new_car.status).toEqual("new")
  
  it 'adds an id to new objects if an id is specified but empty', ->
    new_car = cars.add
      id: '',
      make: "Tesla",
      model: "Roadster",
      year: 2009

    expect(cars.objects.length).toEqual(4)
    expect(cars.dirty_object_count).toEqual(1)
    expect(new_car.status).toEqual("new")
    expect(new_car.id).not.toEqual("")

  it 'can add second-level objects', ->
    car = cars.find(2)
    new_part = car.parts.add
      name: "Intercooler",
      year: 259.99

    expect(car.parts.length).toEqual(2)
    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(1)
    expect(new_part.status).toEqual("new")

  it 'can add second-level objects with a specified id', ->
    car = cars.find(1)
    new_part = car.parts.add
      id: 12,
      make: "ECU",
      year: 189.99

    expect(car.parts.length).toEqual(3)
    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(1)
    expect(new_part.status).toEqual("new")
  
  it 'adds an id to new sub-objects if an id is specified but empty', ->
    car = cars.find(1)
    new_part = car.parts.add
      id: '',
      make: "ECU",
      year: 189.99

    expect(car.parts.length).toEqual(3)
    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(1)
    expect(new_part.status).toEqual("new")
    expect(new_part.id).not.toEqual("")

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

  it 'can update new sub-objects via instances', ->
    car = cars.find(1)
    new_part = car.parts.add
      name: "Exhaust Manifold"
      price: 249.99
    
    new_part.name = "Intake Filter"
    new_part.price = 19.99
    new_part.update()

    expect(car.parts.find(new_part.id).name).toEqual("Intake Filter")
    expect(car.parts.find(new_part.id).price).toEqual(19.99)
    expect(car.status).toEqual('dirty')
    expect(cars.objects.length).toEqual(3)
    expect(car.parts.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(1)
    expect(new_part.status).toEqual("new")

  it 'can update existing sub-objects via instances', ->
    car = cars.find(1)
    part = car.parts.find(1)
    part.name = "Exhaust Manifold"
    part.price = 249.99
    part.update()

    expect(car.parts.find(1).name).toEqual("Exhaust Manifold")
    expect(car.parts.find(1).price).toEqual(249.99)
    expect(cars.find(1).status).toEqual('dirty')
    expect(cars.objects.length).toEqual(3)
    expect(car.parts.length).toEqual(2)
    expect(cars.dirty_object_count).toEqual(1)
  
  it 'can update new objects by passing updated attributes as arguments', ->
    new_car = cars.add
      make: "Dodge",
      model: "Viper SRT-10",
      year: 2008

    new_car.update
      make: "Lamborghini"
      model: "Murcielago"
      year: 2009

    expect(cars.find(new_car.id).make).toEqual("Lamborghini")
    expect(cars.find(new_car.id).model).toEqual("Murcielago")
    expect(cars.find(new_car.id).year).toEqual(2009)
    expect(cars.find(new_car.id).status).toEqual('new')
    expect(cars.objects.length).toEqual(4)
    expect(cars.dirty_object_count).toEqual(1)

  it 'can update existing objects by passing updated attributes as arguments', ->
    car = cars.find(1)
    car.update
      make: "Toyota"
      model: "Supra"
      year: 2002

    expect(cars.find(1).make).toEqual("Toyota")
    expect(cars.find(1).model).toEqual("Supra")
    expect(cars.find(1).year).toEqual(2002)
    expect(cars.find(1).status).toEqual('dirty')
    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(1)
  
  it 'can update new objects by passing updated attributes as arguments to static methods', ->
    new_car = cars.add
      make: "Dodge",
      model: "Viper SRT-10",
      year: 2008

    cars.update
      id: new_car.id
      make: "Lamborghini"
      model: "Murcielago"
      year: 2009

    expect(cars.find(new_car.id).make).toEqual("Lamborghini")
    expect(cars.find(new_car.id).model).toEqual("Murcielago")
    expect(cars.find(new_car.id).year).toEqual(2009)
    expect(cars.find(new_car.id).status).toEqual('new')
    expect(cars.objects.length).toEqual(4)
    expect(cars.dirty_object_count).toEqual(1)

  it 'can update existing objects by passing updated attributes as arguments to static methods', ->
    car = cars.find(1)

    cars.update
      id: car.id
      make: "Toyota"
      model: "Supra"
      year: 2002

    expect(cars.find(1).make).toEqual("Toyota")
    expect(cars.find(1).model).toEqual("Supra")
    expect(cars.find(1).year).toEqual(2002)
    expect(cars.find(1).status).toEqual('dirty')
    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(1)

  it 'only accepts updates for pre-defined attributes on objects', ->
    car = cars.find(1)
    car.update
      make: "Toyota"
      model: "Supra"
      year: 2002
      trim: "GTS"

    expect(cars.find(1).make).toEqual("Toyota")
    expect(cars.find(1).model).toEqual("Supra")
    expect(cars.find(1).year).toEqual(2002)
    expect(cars.find(1).trim).toBeUndefined()
    expect(cars.find(1).status).toEqual('dirty')
    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(1)

  it 'accepts updates to id attributes on objects using vault methods', ->
    cars.update {
      id: 213
      make: "Toyota"
      model: "Supra"
      year: 2002
      trim: "GTS"},
      1

    expect(cars.find(213).id).toEqual(213)
    expect(cars.find(213).make).toEqual("Toyota")
    expect(cars.find(213).model).toEqual("Supra")
    expect(cars.find(213).year).toEqual(2002)
    expect(cars.find(213).trim).toBeUndefined()
    expect(cars.find(213).status).toEqual('dirty')
    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(1)

  it 'accepts updates to id attributes on objects using instance methods', ->
    car = cars.find(1)
    car.update
      id: 213
      make: "Toyota"
      model: "Supra"
      year: 2002
      trim: "GTS"

    expect(cars.find(213).id).toEqual(213)
    expect(cars.find(213).make).toEqual("Toyota")
    expect(cars.find(213).model).toEqual("Supra")
    expect(cars.find(213).year).toEqual(2002)
    expect(cars.find(213).trim).toBeUndefined()
    expect(cars.find(213).status).toEqual('dirty')
    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(1)

  it 'can update new sub-objects by passing updated attributes as arguments', ->
    car = cars.find(1)
    new_part = car.parts.add
      name: "Exhaust Manifold"
      price: 249.99
    
    new_part.update
      name: "Intake Filter"
      price: 19.99

    expect(car.parts.find(new_part.id).name).toEqual("Intake Filter")
    expect(car.parts.find(new_part.id).price).toEqual(19.99)
    expect(car.status).toEqual('dirty')
    expect(cars.objects.length).toEqual(3)
    expect(car.parts.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(1)
    expect(new_part.status).toEqual("new")

  it 'can update existing sub-objects by passing updated attributes as arguments', ->
    car = cars.find(1)
    part = car.parts.find(1)

    part.update
      name: "Exhaust Manifold"
      price: 249.99

    expect(car.parts.find(1).name).toEqual("Exhaust Manifold")
    expect(car.parts.find(1).price).toEqual(249.99)
    expect(cars.find(1).status).toEqual('dirty')
    expect(cars.objects.length).toEqual(3)
    expect(car.parts.length).toEqual(2)
    expect(cars.dirty_object_count).toEqual(1)

  it 'only accepts updates for pre-defined attributes on sub-objects', ->
    car = cars.find(1)
    part = car.parts.find(1)

    part.update
      name: "Exhaust Manifold"
      price: 249.99
      condition: "used"

    expect(car.parts.find(1).name).toEqual("Exhaust Manifold")
    expect(car.parts.find(1).price).toEqual(249.99)
    expect(car.parts.find(1).condition).toBeUndefined()
    expect(cars.find(1).status).toEqual('dirty')
    expect(cars.objects.length).toEqual(3)
    expect(car.parts.length).toEqual(2)
    expect(cars.dirty_object_count).toEqual(1)

  it 'accepts updates to id attributes on sub-objects using sub-collection methods', ->
    car = cars.find(1)

    car.parts.update {
      id: 215
      name: "Exhaust Manifold"
      price: 249.99},
      1

    expect(car.parts.find(215).id).toEqual(215)
    expect(car.parts.find(215).name).toEqual("Exhaust Manifold")
    expect(car.parts.find(215).price).toEqual(249.99)
    expect(car.parts.find(215).condition).toBeUndefined()
    expect(cars.find(1).status).toEqual('dirty')
    expect(cars.objects.length).toEqual(3)
    expect(car.parts.length).toEqual(2)
    expect(cars.dirty_object_count).toEqual(1)

  it 'accepts updates to id attributes on sub-objects using instance methods', ->
    car = cars.find(1)
    part = car.parts.find(1)

    part.update
      id: 215
      name: "Exhaust Manifold"
      price: 249.99

    expect(car.parts.find(215).id).toEqual(215)
    expect(car.parts.find(215).name).toEqual("Exhaust Manifold")
    expect(car.parts.find(215).price).toEqual(249.99)
    expect(car.parts.find(215).condition).toBeUndefined()
    expect(cars.find(1).status).toEqual('dirty')
    expect(cars.objects.length).toEqual(3)
    expect(car.parts.length).toEqual(2)
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
      expect(['id', 'make', 'model', 'year', 'parts', 'dealers']).toContain key
    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(0)

  it 'can strip new sub-objects', ->
    car = cars.find(3)
    new_part = car.parts.add
      name: "Exhaust Manifold"
      price: 249.99
    stripped_car = cars.strip(car)
    
    # Make sure the sub-collection methods have been removed.
    for key, value of stripped_car.parts
      expect(['0']).toContain key

    # Make sure the sub-object instance methods have been removed.
    for part in stripped_car.parts
      for key, value of part
        expect(['name', 'price']).toContain key

  it 'can strip existing sub-objects', ->
    car = cars.find(1)
    stripped_car = cars.strip(car)
    
    # Make sure the sub-collection methods have been removed.
    for key, value of stripped_car.parts
      expect(['0', '1']).toContain key

    # Make sure the sub-object instance methods have been removed.
    for part in stripped_car.parts
      for key, value of part
        expect(['id', 'name', 'price']).toContain key

  it 'can delete new objects via instances', ->
    new_car = cars.add
      make: "Dodge",
      model: "Viper SRT-10",
      year: 2008
    new_car.delete()

    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(0)

  it 'can delete new objects via methods', ->
    new_car = cars.add
      id: 12,
      make: "Tesla",
      model: "Roadster",
      year: 2009
    cars.delete(12)

    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(0)

  it 'can delete existing objects via instances', ->
    car = cars.find(1)
    car.delete()

    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(1)
    expect(car.status).toEqual('deleted')

  it 'can delete existing objects via methods', ->
    cars.delete(3)

    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(1)
    expect(cars.find(3).status).toEqual('deleted')
  
  it 'can delete new sub-objects via instances', ->
    car = cars.find(3)
    new_part = car.parts.add
      id: 12,
      name: "Windshield",
      year: 599.99
    new_part.delete()

    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(1)
    expect(car.parts.length).toEqual(0)
  
  it 'can delete new sub-objects via methods', ->
    car = cars.find(3)
    new_part = car.parts.add
      id: 12,
      name: "Windshield",
      year: 599.99
    car.parts.delete(12)

    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(1)
    expect(car.parts.length).toEqual(0)
  
  it 'can delete existing sub-objects via instances', ->
    car = cars.find(1)
    new_part = car.parts.find(2)
    new_part.delete()

    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(1)
    expect(car.parts.length).toEqual(1)
    expect(car.status).toEqual('dirty')
  
  it 'can delete existing sub-objects via methods', ->
    car = cars.find(1)
    car.parts.delete(2)

    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(1)
    expect(car.parts.length).toEqual(1)
    expect(car.status).toEqual('dirty')

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

  it 'can destroy new objects using Vault methods', ->
    new_car = cars.add
      id: 12,
      make: "Tesla",
      model: "Roadster",
      year: 2009
    cars.destroy(12)

    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(0)

  it 'can destroy existing objects using Vault methods', ->
    cars.destroy(3)

    expect(cars.objects.length).toEqual(2)
    expect(cars.dirty_object_count).toEqual(0)
    expect(cars.find(3)).toBeFalsy()

  it 'can destroy new objects using Vault object methods', ->
    new_car = cars.add
      id: 12,
      make: "Tesla",
      model: "Roadster",
      year: 2009
    new_car.destroy()

    expect(cars.objects.length).toEqual(3)
    expect(cars.dirty_object_count).toEqual(0)

  it 'can destroy existing objects using Vault object methods', ->
    cars.find(3).destroy()

    expect(cars.objects.length).toEqual(2)
    expect(cars.dirty_object_count).toEqual(0)
    expect(cars.find(3)).toBeFalsy()

  it 'can save individual objects properly', ->
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
    
    car.save ->
      expect(cars.objects.length).toEqual(4)
      expect(cars.dirty_object_count).toEqual(1)

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
  
  it 'is extending stored objects after a reload', ->
    # Save a dirty collection to the offline store.
    cars.find(1).update()
    cars.store()

    # Force the collection to be reloaded from the offline store.
    cars = new Vault 'cars', urls,
      offline: true
      sub_collections: ['parts', 'dealers']
    waitsFor ->
      not cars.locked

    expect(cars.find(1).update).toBeDefined()
    expect(cars.find(1).delete).toBeDefined()
  
  it 'is extending stored sub-collections after a reload', ->
    # Save a dirty collection to the offline store.
    cars.find(1).update()
    cars.store()
    
    # Force the collection to be reloaded from the offline store.
    cars = new Vault 'cars', urls,
      offline: true
      sub_collections: ['parts', 'dealers']
    waitsFor ->
      not cars.locked

    expect(cars.find(1).parts.find).toBeDefined()
    expect(cars.find(1).parts.add).toBeDefined()
    expect(cars.find(1).parts.delete).toBeDefined()
  
  it 'is extending stored sub-objects after a reload', ->
    # Save a dirty collection to the offline store.
    cars.find(1).update()
    cars.store()

    # Force the collection to be reloaded from the offline store.
    cars = new Vault 'cars', urls,
      offline: true
      sub_collections: ['parts', 'dealers']
    waitsFor ->
      not cars.locked

    part = cars.parts.find(3)
    dealer = cars.dealers.find(1)

    expect(part.update).toBeDefined()
    expect(part.delete).toBeDefined()
    expect(dealer.update).toBeDefined()
    expect(dealer.delete).toBeDefined()
  
  it "doesn't bother storing an empty collection", ->
    # Intialize an empty vault.
    test = new Vault 'test',
      offline: true
    waitsFor ->
      not test.locked
    
    # Ensure that nothing of any value is stored.
    expect(localStorage.test?).toBeFalsy()
    test.store()
    expect(localStorage.test?).toBeFalsy()