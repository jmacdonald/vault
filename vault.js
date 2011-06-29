(function() {
  var Vault;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Vault = (function() {
    function Vault(name, urls, options) {
      var option, value;
      if (options == null) {
        options = {};
      }
      this.objects = [];
      this.dirty_objects = 0;
      this.errors = [];
      this.date = new Date;
      this.name = name;
      this.urls = urls;
      this.options = {
        autoload: true,
        after_load: function() {},
        id_attribute: "id",
        offline: false
      };
      for (option in options) {
        value = options[option];
        this.options[option] = value;
      }
      if (this.options.autoload) {
        if (this.options.offline) {
          if (!this.load()) {
            this.reload(this.options.after_load);
          }
        } else {
          this.reload(this.options.after_load);
        }
      }
      if (this.options.offline) {
        $(window).unload(__bind(function() {
          return this.store();
        }, this));
      }
    }
    Vault.prototype.add = function(object) {
      if (object[this.options.id_attribute] != null) {
        object[this.options.id_attribute] = this.date.getTime();
      }
      this.extend(object, "new");
      this.objects.push(object);
      return object;
    };
    Vault.prototype.fetch = function(id) {
      var object, _i, _len, _ref;
      _ref = this.objects;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        object = _ref[_i];
        if (object[this.options.id_attribute] === id) {
          return object;
        }
      }
      return false;
    };
    Vault.prototype.update = function(updated_object) {
      var index, object, _len, _ref;
      _ref = this.objects;
      for (index = 0, _len = _ref.length; index < _len; index++) {
        object = _ref[index];
        if (object[this.options.id_attribute] === updated_object.id) {
          if (object.status === "new") {
            this.objects[index] = this.extend(updated_object, "new");
          } else {
            this.objects[index] = this.extend(updated_object, "dirty");
          }
          return true;
        }
      }
      return false;
    };
    Vault.prototype["delete"] = function(id) {
      var index, object, _len, _ref;
      _ref = this.objects;
      for (index = 0, _len = _ref.length; index < _len; index++) {
        object = _ref[index];
        if (object[this.options.id_attribute] === id) {
          if (object.status === "new") {
            this.objects.splice(index, 1);
          } else {
            object.status = "deleted";
          }
          return true;
        }
      }
      return false;
    };
    Vault.prototype.save = function(after_save) {
      var object, sync_error, temporary_id, _i, _len, _ref, _results;
      if (after_save == null) {
        after_save = function() {};
      }
      if (!(navigator.onLine && this.dirty_objects !== 0)) {
        if (!navigator.onLine) {
          this.errors.push('Cannot reload, navigator is offline.');
        }
        if (this.dirty_objects === 0) {
          this.errors.push('Nothing to sync.');
        }
        return after_save();
      }
      this.errors = [];
      sync_error = false;
      _ref = this.objects;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        object = _ref[_i];
        _results.push((function() {
          switch (object.status) {
            case "deleted":
              return $.ajax({
                type: 'DELETE',
                url: this.urls["delete"],
                data: this.strip(object),
                success: __bind(function(data) {
                  return this.extend(object);
                }, this),
                error: __bind(function() {
                  this.extend(object, "deleted");
                  this.errors.push('Failed to delete.');
                  if (this.dirty_objects - this.errors.length === 0) {
                    return after_save();
                  }
                }, this),
                complete: function() {
                  if (this.dirty_objects - this.errors.length === 0) {
                    return after_save();
                  }
                },
                dataType: 'json'
              });
            case "new":
              temporary_id = object.id;
              return $.ajax({
                type: 'POST',
                url: this.urls.create,
                data: this.strip(object),
                success: __bind(function(data) {
                  return object = this.extend(data);
                }, this),
                error: __bind(function() {
                  object[this.options.id_attribute] = temporary_id;
                  this.extend(object, "new");
                  this.errors.push('Failed to create.');
                  if (this.dirty_objects - this.errors.length === 0) {
                    return after_save();
                  }
                }, this),
                complete: function() {
                  if (this.dirty_objects - this.errors.length === 0) {
                    return after_save();
                  }
                },
                dataType: 'json'
              });
            case "dirty":
              return $.ajax({
                type: 'POST',
                url: this.urls.update,
                data: this.strip(object),
                success: __bind(function(data) {
                  return this.extend(object);
                }, this),
                error: __bind(function() {
                  this.extend(object, "dirty");
                  this.errors.push('Failed to update.');
                  if (this.dirty_objects - this.errors.length === 0) {
                    return after_save();
                  }
                }, this),
                complete: function() {
                  if (this.dirty_objects - this.errors.length === 0) {
                    return after_save();
                  }
                },
                dataType: 'json'
              });
          }
        }).call(this));
      }
      return _results;
    };
    Vault.prototype.reload = function(after_load) {
      if (after_load == null) {
        after_load = function() {};
      }
      if (!navigator.onLine) {
        this.errors.push('Cannot reload, navigator is offline.');
        return after_load();
      }
      return $.ajax({
        url: this.urls.list,
        dataType: 'json',
        success: __bind(function(data) {
          var object, _i, _len, _ref;
          this.objects = data;
          _ref = this.objects;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            object = _ref[_i];
            this.extend(object);
          }
          this.dirty_objects = 0;
          return after_load();
        }, this),
        error: __bind(function() {
          this.errors.push('Failed to list.');
          return after_load();
        }, this)
      });
    };
    Vault.prototype.synchronize = function(after_sync) {
      if (after_sync == null) {
        after_sync = function() {};
      }
      if (!navigator.onLine) {
        this.errors.push('Cannot synchronize, navigator is offline.');
        return after_sync();
      }
      return this.save(function() {
        if (this.errors.length === 0) {
          return this.reload(after_sync);
        } else {
          return after_sync();
        }
      });
    };
    Vault.prototype.load = function() {
      if (!this.options.offline) {
        return false;
      }
      if (localStorage.getItem(this.name)) {
        this.objects = $.parseJSON(localStorage.getItem(this.name));
        return true;
      } else {
        return false;
      }
    };
    Vault.prototype.store = function() {
      if (!this.options.offline) {
        return false;
      }
      localStorage.setItem(this.name, JSON.stringify(this.objects));
      return true;
    };
    Vault.prototype.extend = function(object, status) {
      if (status == null) {
        status = "clean";
      }
      object.status = status;
      object.update = function() {
        if (this.status !== "new") {
          return this.status = "dirty";
        }
      };
      object["delete"] = __bind(function() {
        return this["delete"](object.id);
      }, this);
      return object;
    };
    Vault.prototype.strip = function(object) {
      if (object.status === "new") {
        delete object[this.options.id_attribute];
      }
      delete object.status;
      delete object.update;
      return delete object["delete"];
    };
    window.Vault = Vault;
    return Vault;
  })();
}).call(this);
