(function() {
  var Vault;
  Vault = (function() {
    function Vault(options) {
      this.objects = [];
      this.dirty_objects = 0;
      this.errors = [];
      this.name = options.name;
      this.urls = options.urls;
      this.id_attribute = options.id_attribute;
    }
    Vault.prototype.save = function(complete_callback) {
      var object, sync_error, _i, _len, _ref, _results;
      if (!(navigator.onLine && this.dirty_objects !== 0)) {
        complete_callback();
        return;
      }
      sync_error = false;
      _ref = this.objects;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        object = _ref[_i];
        _results.push(object.changed ? object.deleted ? $.ajax({
          type: 'DELETE',
          url: this.urls.remove,
          data: object,
          success: function(data) {
            return object.changed = false;
          },
          error: function() {
            return this.errors.push('Failed to delete.');
          },
          complete: function() {
            if (--dirty_objects === 0) {
              return complete_callback();
            }
          },
          dataType: 'json'
        }) : object[this.id_attribute] === void 0 ? $.ajax({
          type: 'POST',
          url: this.urls.create,
          data: object,
          success: function(data) {
            object[this.id_attribute] = data.id;
            return object.changed = false;
          },
          error: function() {
            return this.errors.push('Failed to create.');
          },
          complete: function() {
            if (--dirty_objects === 0) {
              return complete_callback();
            }
          },
          dataType: 'json'
        }) : $.ajax({
          type: 'POST',
          url: this.urls.update,
          data: object,
          success: function(data) {
            return object.changed = false;
          },
          error: function() {
            return this.errors.push('Failed to update.');
          },
          complete: function() {
            if (--dirty_objects === 0) {
              return complete_callback();
            }
          },
          dataType: 'json'
        }) : void 0);
      }
      return _results;
    };
    Vault.prototype.reload = function() {
      return $.getJSON(this.urls.list, function(data) {
        var object, _i, _len, _ref;
        this.objects = data;
        _ref = this.objects;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          object = _ref[_i];
          object.changed = false;
        }
        return this.dirty_objects = 0;
      });
    };
    Vault.prototype.synchronize = function() {
      return this.save(this.reload);
    };
    window.Vault = Vault;
    return Vault;
  })();
}).call(this);
