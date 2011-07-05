class Vault
  constructor: (name, urls, options = {}) ->
    # Setup some internal variables.
    @objects = []
    @dirty_object_count = 0
    @errors = []
    @save_error_count = 0

    # This property is used to temporarily lock the vault during mutation methods.
    @locked = false

    # Create a date object which will be used to
    # generate unique IDs for new records.
    @date = new Date

    # Import required parameters for the data store.
    @name = name
    @urls = urls

    # Declare default options.
    @options =
      autoload: true
      after_load: ->
      id_attribute: "id"
      offline: false

    # Merge default options with user-defined ones.
    for option, value of options
      @options[option] = value

    # Setup the vault for offline use.
    if @options.offline
      # Bind a cache routine to save data should the window be closed or url changed.
      $(window).unload =>
        @store()

    # Load the collection if configured to do so.
    if @options.autoload
      # Check the offline data store first, if configured to do so.
      if @options.offline
        if @load()
          if @dirty_object_count > 0
            # Offline data loaded and modifications found; keep existing data.
            @options.after_load
          else
            # No modifications in offline data; reload fresh data.
            @reload(@options.after_load)
        else
          if navigator.onLine
            # Load failed, but we're connected; reload fresh data.
            @reload(@options.after_load)
          else
            # Load failed and we're offline; log an error.
            @errors.push "Offline data failed to load. Could not load live data as browser is offline."
      else
        @reload(@options.after_load)

  # Iterate over non-deleted items in the collection.
  each: (logic) ->
    for object in @objects
      unless object.status == "deleted"
        logic object

  # Add a new item to the collection.
  add: (object) ->
    # Don't bother if the vault is locked.
    if @locked
      @errors.push 'Cannot add, vault is locked.'
      return false

    # If the object has no id, generate a temporary one and add it to the object.
    unless object[@options.id_attribute]?
      object[@options.id_attribute] = @date.getTime()

    # Extend the object with vault-specific variables and functions.
    @extend object,"new"

    # Add the object to the collection.
    @objects.push object

    # Increase the count of dirty objects.
    @dirty_object_count++

    # Store the collection.
    @store

    # Return the extended object.
    return object

  # Fetch an object in the collection using its id.
  fetch: (id) ->
    for object in @objects
      if object[@options.id_attribute] == id
        return object

    # Object not found.
    return false

  # Update an existing item in the collection.
  update: (id) ->
    # Don't bother if the vault is locked.
    if @locked
      @errors.push 'Cannot update, vault is locked.'
      return false

    # Find the object and flag it as dirty.
    for object, index in @objects
      if object[@options.id_attribute] == id
        if object.status is "clean"
          object.status = "dirty"
          @dirty_object_count++

        # Store the collection.
        @store

        # Update was successful.
        return true

    # Object not found.
    return false

  # Flag an object in the collection for deletion,
  # or if the object is new, remove it.
  delete: (id) ->
    # Don't bother if the vault is locked.
    if @locked
      @errors.push 'Cannot delete, vault is locked.'
      return false

    for object, index in @objects
      if object[@options.id_attribute] == id
        switch object.status
          when "new"
            # New objects are special; we essentially want to
            # reverse the steps taken during the add operation.
            @objects.splice(index, 1)
            @dirty_object_count--
          when "clean"
            object.status = "deleted"
            @dirty_object_count++
          when "dirty"
            object.status = "deleted"

        # Store the collection.
        @store

        # Delete was successful.
        return true

    # Object not found.
    return false

  # Write local changes back to the server, using per-object requests.
  save: (after_save = ->) ->
    # Don't bother if the vault is locked, we're offline or there's nothing to sync.
    if @locked
      @errors.push 'Cannot save, vault is locked.'
      return after_save()
    else if not navigator.onLine
      @errors.push 'Cannot save, navigator is offline.'
      return after_save()
    else if @dirty_object_count is 0
      @errors.push 'Nothing to save.'
      return after_save()

    # Lock the vault until the save is complete.
    @locked = true

    # Clear the save error count as we're starting a new save operation.
    @save_error_count = 0

    # Sync the in-memory data store to the server.
    sync_error = false
    for object in @objects
      do (object) =>
        switch object.status
          when "deleted"
            $.ajax
              type: 'DELETE'
              url: @urls.delete
              data: @strip object
              fixture: (settings) ->
                return true
              success: (data) =>
                # Forcibly remove the deleted object from the collection.
                for vault_object, index in @objects
                  if vault_object.id == object.id
                    @objects.splice(index, 1)
                    @dirty_object_count--
              error: =>
                @errors.push 'Failed to delete.'
                @save_error_count++
              complete: =>
                # Check to see if we're done.
                if @dirty_object_count - @save_error_count is 0
                  # Store the collection, unlock the vault, and execute the callback method.
                  @store
                  @locked = false
                  after_save()
              dataType: 'json'
          when "new"
            $.ajax
              type: 'POST'
              url: @urls.create
              data: @strip object
              fixture: (settings) =>
                settings.data.id = @date.getTime()

                return settings.data
              success: (data) =>
                # Replace the existing object with the new one from the server and extend it.
                object = @extend data # This will also set its status to clean.
                @dirty_object_count--
              error: =>
                @errors.push 'Failed to create.'
                @save_error_count++
              complete: =>
                # Check to see if we're done.
                if @dirty_object_count - @save_error_count is 0
                  # Store the collection, unlock the vault, and execute the callback method.
                  @store
                  @locked = false
                  after_save()
              dataType: 'json'
          when "dirty"
            $.ajax
              type: 'POST'
              url: @urls.update
              data: @strip object
              fixture: (settings) ->
                return true
              success: (data) =>
                object.status = "clean"
                @dirty_object_count--
              error: =>
                @errors.push 'Failed to update.'
                @save_error_count++
              complete: =>
                # Check to see if we're done.
                if @dirty_object_count - @save_error_count is 0
                  # Store the collection, unlock the vault, and execute the callback method.
                  @store
                  @locked = false
                  after_save()
              dataType: 'json'
  
  # Used to wipe out the in-memory object list with a fresh one from the server.
  reload: (after_load = ->) ->
    # Don't bother if the vault is locked or we're offline.
    if @locked
      @errors.push 'Cannot reload, vault is locked.'
      return after_load()
    else if not navigator.onLine
      @errors.push 'Cannot reload, navigator is offline.'
      return after_load()

    # Lock the vault until the reload is complete.
    @locked = true

    $.ajax
      url: @urls.list
      dataType: 'json'
      success: (data) =>
        # Replace the list of in-memory objects with the new data.
        @objects = data

        # Extend the objects with vault-specific variables and functions.
        for object in @objects
          @extend object

        # Reset the count of dirty objects.
        @dirty_object_count = 0

        # Store the collection.
        @store

        # Call the callback function as the reload is complete.
        after_load()
      error: =>
        @errors.push 'Failed to list.'

        # Call the callback function as the reload is complete (albeit unsuccessful).
        after_load()
      complete: =>
        # Unlock the vault as the reload is complete.
        @locked = false

  # Convenience method for saving and reloading in one shot.
  synchronize: (after_sync = ->) ->
    # Don't bother if we're offline.
    unless navigator.onLine
      @errors.push 'Cannot synchronize, navigator is offline.'
      return after_sync()

    @save =>
      # Only reload the collection if there were no save errors.
      if @errors.length is 0
        @reload(after_sync)
      else
        after_sync()

  # Load the collection from offline storage.
  load: ->
    # Don't bother if offline support is disabled.
    unless @options.offline
      return false

    # Try to load the collection.
    if localStorage.getItem(@name)
      @objects = $.parseJSON(localStorage.getItem @name)

      # Calculate the number of dirty objects.
      for object in @objects
        unless object.status == "clean"
          @dirty_object_count++
      
      return true
    else
      return false

  # Store the collection for offline use.
  store: ->
    # Don't bother if offline support is disabled.
    unless @options.offline
      return false

    # Store the collection.
    localStorage.setItem(@name, JSON.stringify(@objects))
    return true

  # Extend an object with vault-specific variables and functions.
  extend: (object, status="clean") ->
    object.status = status
    object.update = =>
      @update(object.id)
    object.delete = =>
      @delete(object.id)

    return object

  # Return a copy of an object with vault-specific variables and functions removed.
  strip: (object) ->
    # Clone the object so that we don't strip the original.
    object_clone = @clone object

    # Remove the temporary id given to new objects.
    if object_clone.status is "new"
      delete object_clone[@options.id_attribute]
    
    delete object_clone.status
    delete object_clone.update
    delete object_clone.delete

    return object_clone

  # Clone (deep copy) an object.
  clone: (object) ->
    unless object? and typeof object is 'object'
      return object

    new_instance = new object.constructor()

    for key of object
      new_instance[key] = @clone object[key]

    return new_instance

  # Attach the Vault class to the window so that it can be used by other scripts.
  window.Vault = this