(function() {
  var Vault;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Vault = (function() {
    function Vault(name, urls, id_attribute) {
      this.objects = [];
      this.dirty_objects = 0;
      this.errors = [];
      this.name = name;
      this.urls = urls;
      this.id_attribute = id_attribute;
    }
    Vault.prototype.fetch = function(id) {
      var object, _i, _len;
      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        object = objects[_i];
        if (object[this.id_attribute] === id) {
          return object;
        }
      }
      return false;
    };
    Vault.prototype["delete"] = function(id) {
      var object, _i, _len;
      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        object = objects[_i];
        if (object[this.id_attribute] === id) {
          object.deleted = true;
          return true;
        }
      }
      return false;
    };
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
          url: this.urls["delete"],
          data: object,
          success: function(data) {
            return object.changed = false;
          },
          error: __bind(function() {
            return this.errors.push('Failed to delete.');
          }, this),
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
          success: __bind(function(data) {
            object[this.id_attribute] = data.id;
            return object.changed = false;
          }, this),
          error: __bind(function() {
            return this.errors.push('Failed to create.');
          }, this),
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
          error: __bind(function() {
            return this.errors.push('Failed to update.');
          }, this),
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
    Vault.prototype.reload = function(complete_callback) {
      return $.ajax({
        url: this.urls.list,
        dataType: 'json',
        success: __bind(function(data) {
          var object, _i, _len, _ref;
          this.objects = data;
          _ref = this.objects;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            object = _ref[_i];
            object.changed = false;
          }
          this.dirty_objects = 0;
          return complete_callback();
        }, this),
        error: __bind(function() {
          return this.errors.push('Failed to list.');
        }, this)
      });
    };
    Vault.prototype.synchronize = function(complete_callback) {
      return this.save(this.reload(complete_callback));
    };
    window.Vault = Vault;
    return Vault;
  })();
}).call(this);
