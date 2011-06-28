class Vault
  constructor: (name, urls, options = {}) ->
    # Setup some internal variables.
    @objects = []
    @dirty_objects = 0
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
    # Generate a temporary id and add it to the object.
    object[@options.id_attribute] = @date.getTime()

    # Extend the object with vault-specific variables and functions.
    @extend object "new"

    # Add the object to the collection.
    @objects.push new_object

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
        if object.status == "new"
          @objects[index] = @extend updated_object "new"
        else
          @objects[index] = @extend updated_object "dirty"
        return true

    # Object not found.
    return false

  # Remove or flag an object in the collection for deletion, based on its status.
  delete: (id) ->
    for object, index in @objects
      if object[@options.id_attribute] == id
        if object.status == "new"
          @objects.splice(index, 1)
        else
          object.status = "deleted"
        return true

    # Object not found.
    return false

  # Write local changes back to the server, using per-object requests.
  save: (complete_callback = ->) ->
    # Don't bother if we're offline or there's nothing to sync.
    unless navigator.onLine and @dirty_objects != 0
      unless navigator.onLine
        @errors.push 'Cannot reload, navigator is offline.'
      unless @dirty_objects != 0
        @errors.push 'Nothing to sync.'
      return complete_callback()

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
            success: (data) => @extend object
            error: =>
              @extend object "deleted"
              @errors.push 'Failed to delete.'
              # Check to see if we're done.
              if @dirty_objects - @errors.length == 0
                complete_callback()
            complete: ->
              # Check to see if we're done.
              if @dirty_objects - @errors.length == 0
                complete_callback()
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
              
              @extend object "new"
              @errors.push 'Failed to create.'
              # Check to see if we're done.
              if @dirty_objects - @errors.length == 0
                complete_callback()
            complete: ->
              # Check to see if we're done.
              if @dirty_objects - @errors.length == 0
                complete_callback()
            dataType: 'json'
        when "dirty"
          $.ajax
            type: 'POST'
            url: @urls.update
            data: @strip object
            success: (data) => @extend object
            error: =>
              @extend object "dirty"
              @errors.push 'Failed to update.'
              # Check to see if we're done.
              if @dirty_objects - @errors.length == 0
                complete_callback()
            complete: ->
              # Check to see if we're done.
              if @dirty_objects - @errors.length == 0
                complete_callback()
            dataType: 'json'
  
  # Used to wipe out the in-memory object list with a fresh one from the server.
  reload: (complete_callback = ->) ->
    # Don't bother if we're offline.
    unless navigator.onLine
      @errors.push 'Cannot reload, navigator is offline.'
      return complete_callback()

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
        @dirty_objects = 0

        # Call the callback function as the reload is complete.
        complete_callback()
      error: =>
        @errors.push 'Failed to list.'

        # Call the callback function as the reload is complete (albeit unsuccessful).
        complete_callback()

  # Convenience method for saving and reloading in one shot.
  synchronize: (complete_callback = ->) ->
    # Don't bother if we're offline.
    unless navigator.onLine
      @errors.push 'Cannot synchronize, navigator is offline.'
      return complete_callback()

    @save ->
      if @errors.length == 0
        @reload(complete_callback)
      else
        complete_callback()

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
      unless this.status == "new"
        this.status = "dirty"
    object.delete = =>
      @delete(object.id)

    return object

  # Remove vault-specific variables and functions applied to an object.
  strip: (object) ->
    # Remove the temporary id given to new objects.
    if object.status == "new"
      delete object[@options.id_attribute]
    
    delete object.status
    delete object.update
    delete object.delete

  # Attach the Vault class to the window so that it can be used by other scripts.
  window.Vault = this