class Vault
  constructor: (name, urls, id_attribute) ->
    # Setup some internal variables.
    @objects = []
    @dirty_objects = 0
    @errors = []

    # Import required parameters for the data store.
    @name = name
    @urls = urls
    @id_attribute = id_attribute

  # Fetch an object in the collection using its id.
  fetch: (id) ->
    for object in objects
      if object[@id_attribute] == id
        return object

    # Object not found.
    return false

  # Flag an object in the collection for deletion, using its id.
  delete: (id) ->
    for object in objects
      if object[@id_attribute] == id
        object.deleted = true
        return true

    # Object not found.
    return false

  # Write local changes back to the server, using per-object requests.
  save: (complete_callback) ->
    # Don't bother if we're offline or there's nothing to sync.
    unless navigator.onLine and @dirty_objects != 0
      complete_callback
      return

    # Clear out any previous errors; this is important because we use the errors
    # array to track failed requests and determine when the save has completed.
    @errors = []

    # Sync the in-memory data store to the server.
    sync_error = false
    for object in @objects
      if object.changed
        if object.deleted
          $.ajax
            type: 'DELETE'
            url: @urls.delete
            data: object
            success: (data) -> object.changed = false
            error: =>
              @errors.push 'Failed to delete.'
              # Check to see if we're done.
              if @dirty_objects - @errors.length == 0
                complete_callback
            complete: ->
              # Check to see if we're done.
              if @dirty_objects - @errors.length == 0
                complete_callback
            dataType: 'json'
        else if object[@id_attribute] == undefined
          # This is a new object to be added.
          $.ajax
            type: 'POST'
            url: @urls.create
            data: object
            success: (data) =>
              object[@id_attribute] = data.id
              object.changed = false
            error: =>
              @errors.push 'Failed to create.'
              # Check to see if we're done.
              if @dirty_objects - @errors.length == 0
                complete_callback
            complete: ->
              # Check to see if we're done.
              if @dirty_objects - @errors.length == 0
                complete_callback
            dataType: 'json'
        else
          # This is a pre-existing object to be updated.
          $.ajax
            type: 'POST'
            url: @urls.update
            data: object
            success: (data) -> object.changed = false
            error: =>
              @errors.push 'Failed to update.'
              # Check to see if we're done.
              if @dirty_objects - @errors.length == 0
                complete_callback
            complete: ->
              # Check to see if we're done.
              if @dirty_objects - @errors.length == 0
                complete_callback
            dataType: 'json'
  # Used to wipe out the in-memory object list with a fresh one from the server.
  reload: (complete_callback) ->
    $.ajax
      url: @urls.list
      dataType: 'json'
      success: (data) =>
        # Replace the list of in-memory objects with the new data.
        @objects = data

        # Set all of the objects to clean status.
        for object in @objects
          object.changed = false

        # Reset the count of dirty objects.
        @dirty_objects = 0

        # Call the callback function as the reload is complete.
        complete_callback
      error: => @errors.push 'Failed to list.'

  # Convenience method for saving and reloading in one shot.
  synchronize: (complete_callback) ->
    @save ->
      if @errors.length == 0
        @reload(complete_callback)
      else
        complete_callback

  # Attach the Vault class to the window so that it can be used by other scripts.
  window.Vault = this