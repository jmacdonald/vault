class Vault
  constructor: (name, urls, options = {}) ->
    # Setup some internal variables.
    @objects = []
    @dirty_object_count = 0
    @errors = []

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

    # Load the collection if configured to do so.
    if @options.autoload
      # Check the offline data store first, if configured to do so.
      if @options.offline
        if not @load()
          @reload(@options.after_load)
      else
        @reload(@options.after_load)

    # Setup the vault for offline use.
    if @options.offline
      # Bind a cache routine to save data should the window be closed or url changed.
      $(window).unload =>
        @store()

  # Add a new item to the collection.
  add: (object) ->

    # If the object has no id, generate a temporary one and add it to the object.
    unless object[@options.id_attribute]?
      object[@options.id_attribute] = @date.getTime()

    # Extend the object with vault-specific variables and functions.
    @extend object,"new"

    # Add the object to the collection.
    @objects.push object

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
  update: (updated_object) ->
    for object, index in @objects
      if object[@options.id_attribute] == updated_object.id
        if object.status is "new"
          @objects[index] = @extend updated_object,"new"
        else
          @objects[index] = @extend updated_object,"dirty"
        return true

    # Object not found.
    return false

  # Remove or flag an object in the collection for deletion, based on its status.
  delete: (id, destroy = false) ->
    for object, index in @objects
      if object[@options.id_attribute] == id
        if object.status is "new" or destroy
          @objects.splice(index, 1)
        else
          object.status = "deleted"
        return true

    # Object not found.
    return false

  # Write local changes back to the server, using per-object requests.
  save: (after_save = ->) ->
    # Don't bother if we're offline or there's nothing to sync.
    if not navigator.onLine or @dirty_object_count is 0
      if not navigator.onLine
        @errors.push 'Cannot reload, navigator is offline.'
      if @dirty_object_count is 0
        @errors.push 'Nothing to sync.'
      return after_save()

    # Clear out any previous errors; this is important because we use the errors
    # array to track failed requests and determine when the save has completed.
    @errors = []

    # Sync the in-memory data store to the server.
    sync_error = false
    for object in @objects
      switch object.status
        when "deleted"
          $.ajax
            type: 'DELETE'
            url: @urls.delete
            data: @strip object
            success: (data) => object.delete true
            error: =>
              @extend object,"deleted"
              @errors.push 'Failed to delete.'
              # Check to see if we're done.
              if @dirty_object_count - @errors.length is 0
                after_save()
            complete: ->
              # Check to see if we're done.
              if --@dirty_object_count - @errors.length is 0
                after_save()
            dataType: 'json'
        when "new"
          # Store the temporary id so that we can restore
          # it in case this request fails.
          temporary_id = object.id
          $.ajax
            type: 'POST'
            url: @urls.create
            data: @strip object
            success: (data) =>
              # Replace the existing object with the new one from the server and extend it.
              object = @extend data
            error: =>
              # Restore the temporary id, since the request failed.
              object[@options.id_attribute] = temporary_id
              
              @extend object,"new"
              @errors.push 'Failed to create.'
              # Check to see if we're done.
              if @dirty_object_count - @errors.length is 0
                after_save()
            complete: ->
              # Check to see if we're done.
              if --@dirty_object_count - @errors.length is 0
                after_save()
            dataType: 'json'
        when "dirty"
          $.ajax
            type: 'POST'
            url: @urls.update
            data: @strip object
            success: (data) => object.status = "clean"
            error: =>
              @extend object,"dirty"
              @errors.push 'Failed to update.'
              # Check to see if we're done.
              if @dirty_object_count - @errors.length is 0
                after_save()
            complete: ->
              # Check to see if we're done.
              if --@dirty_object_count - @errors.length is 0
                after_save()
            dataType: 'json'
  
  # Used to wipe out the in-memory object list with a fresh one from the server.
  reload: (after_load = ->) ->
    # Don't bother if we're offline.
    unless navigator.onLine
      @errors.push 'Cannot reload, navigator is offline.'
      return after_load()

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

        # Call the callback function as the reload is complete.
        after_load()
      error: =>
        @errors.push 'Failed to list.'

        # Call the callback function as the reload is complete (albeit unsuccessful).
        after_load()

  # Convenience method for saving and reloading in one shot.
  synchronize: (after_sync = ->) ->
    # Don't bother if we're offline.
    unless navigator.onLine
      @errors.push 'Cannot synchronize, navigator is offline.'
      return after_sync()

    @save ->
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
    object.update = ->
      unless this.status is "new"
        this.status = "dirty"
    object.delete = (destroy = false) =>
      @delete(object.id, destroy)

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