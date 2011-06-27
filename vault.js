(function() {
  var Vault;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Vault = (function() {
    function Vault(name, urls, id_attribute, options) {
      var option, value;
      if (options == null) {
        options = {};
      }
      this.objects = [];
      this.dirty_objects = 0;
      this.errors = [];
      this.name = name;
      this.urls = urls;
      this.id_attribute = id_attribute;
      this.options = {
        offline: false
      };
      for (option in options) {
        value = options[option];
        this.options[option] = value;
      }
      if (this.options.offline) {
        $(window).unload(__bind(function() {
          return this.store();
        }, this));
      }
    }
    Vault.prototype.fetch = function(id) {
      var object, _i, _len, _ref;
      _ref = this.objects;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        object = _ref[_i];
        if (object[this.id_attribute] === id) {
          return object;
        }
      }
      return false;
    };
    Vault.prototype["delete"] = function(id) {
      var object, _i, _len, _ref;
      _ref = this.objects;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        object = _ref[_i];
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
        return complete_callback();
      }
      this.errors = [];
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
            this.errors.push('Failed to delete.');
            if (this.dirty_objects - this.errors.length === 0) {
              return complete_callback();
            }
          }, this),
          complete: function() {
            if (this.dirty_objects - this.errors.length === 0) {
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
            this.errors.push('Failed to create.');
            if (this.dirty_objects - this.errors.length === 0) {
              return complete_callback();
            }
          }, this),
          complete: function() {
            if (this.dirty_objects - this.errors.length === 0) {
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
            this.errors.push('Failed to update.');
            if (this.dirty_objects - this.errors.length === 0) {
              return complete_callback();
            }
          }, this),
          complete: function() {
            if (this.dirty_objects - this.errors.length === 0) {
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
            object.update = function() {
              return this.changed = true;
            };
            object["delete"] = function() {
              this.changed = true;
              return this.deleted = true;
            };
          }
          this.dirty_objects = 0;
          return complete_callback();
        }, this),
        error: __bind(function() {
          this.errors.push('Failed to list.');
          return complete_callback();
        }, this)
      });
    };
    Vault.prototype.synchronize = function(complete_callback) {
      return this.save(function() {
        if (this.errors.length === 0) {
          return this.reload(complete_callback);
        } else {
          return complete_callback();
        }
      });
    };
    Vault.prototype.load = function() {
      if (localStorage.getItem(this.name)) {
        this.objects = $.parseJSON(localStorage.getItem(this.name));
        return true;
      } else {
        return false;
      }
    };
    Vault.prototype.store = function() {
      return localStorage.setItem(this.name, JSON.stringify(this.objects));
    };
    window.Vault = Vault;
    return Vault;
  })();
}).call(this);
