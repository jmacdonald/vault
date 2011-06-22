class Vault
  constructor: (options) ->
    # Setup some internal variables.
    @objects = []
    @dirty_objects = 0
    @errors = []

    # Import options for the data store.
    @name = options.name
    @urls = options.urls
    @id_attribute = options.id_attribute

  # Write local changes back to the server, using per-object requests.
  save: (complete_callback) ->
    # Don't bother if we're offline or there's nothing to sync.
    unless navigator.onLine and @dirty_objects != 0
      complete_callback()
      return

    # Sync the in-memory data store to the server.
    sync_error = false
    for object in @objects
      if object.changed
        if object.deleted
          $.ajax
            type: 'DELETE',
            url: @urls.remove
            data: object
            success: (data) -> object.changed = false
            error: -> @errors.push 'Failed to delete.'
            complete: ->
              if --dirty_objects == 0
                complete_callback()
            ,
            dataType: 'json'
        else if object[@id_attribute] == undefined
          # This is a new object to be added.
          $.ajax(
            type: 'POST'
            url: @urls.create
            data: object
            success: (data) ->
              object[@id_attribute] = data.id
              object.changed = false
            error: -> @errors.push 'Failed to create.'
            complete: ->
              if --dirty_objects == 0
                complete_callback()
            ,
            dataType: 'json'
          )
        else
          # This is a pre-existing object to be updated.
          $.ajax(
            type: 'POST',
            url: @urls.update
            data: object
            success: (data) -> object.changed = false
            error: -> @errors.push 'Failed to update.'
            complete: ->
              if --dirty_objects == 0
                complete_callback()
            ,
            dataType: 'json'
          )
  # Used to wipe out the in-memory object list with a fresh one from the server.
  reload: ->
    $.getJSON(
      @urls.list
      (data) ->
        # Replace the list of in-memory objects with the new data.
        @objects = data

        # Set all of the objects to clean status.
        for object in @objects
          object.changed = false

        # Reset the count of dirty objects.
        @dirty_objects = 0
    )

  # Convenience method for saving and reloading in one shot.
  synchronize: ->
    this.save(this.reload)