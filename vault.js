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
      this.dirty_object_count = 0;
      this.errors = [];
      this.save_error_count = 0;
      this.locked = false;
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
      if (this.options.offline) {
        $(window).unload(__bind(function() {
          return this.store();
        }, this));
      }
      if (this.options.autoload) {
        if (this.options.offline) {
          if (this.load()) {
            if (this.dirty_object_count > 0) {
              this.options.after_load;
            } else {
              this.reload(this.options.after_load);
            }
          } else {
            if (navigator.onLine) {
              this.reload(this.options.after_load);
            } else {
              this.errors.push("Offline data failed to load. Could not load live data as browser is offline.");
            }
          }
        } else {
          this.reload(this.options.after_load);
        }
      }
    }
    Vault.prototype.each = function(logic) {
      var object, _i, _len, _ref, _results;
      _ref = this.objects;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        object = _ref[_i];
        _results.push(object.status !== "deleted" ? logic(object) : void 0);
      }
      return _results;
    };
    Vault.prototype.add = function(object) {
      if (this.locked) {
        this.errors.push('Cannot add, vault is locked.');
        return false;
      }
      if (object[this.options.id_attribute] == null) {
        object[this.options.id_attribute] = this.date.getTime();
      }
      this.extend(object, "new");
      this.objects.push(object);
      this.dirty_object_count++;
      this.store;
      return object;
    };
    Vault.prototype.find = function(id) {
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
    Vault.prototype.update = function(id) {
      var index, object, _len, _ref;
      if (this.locked) {
        this.errors.push('Cannot update, vault is locked.');
        return false;
      }
      _ref = this.objects;
      for (index = 0, _len = _ref.length; index < _len; index++) {
        object = _ref[index];
        if (object[this.options.id_attribute] === id) {
          if (object.status === "clean") {
            object.status = "dirty";
            this.dirty_object_count++;
          }
          this.store;
          return true;
        }
      }
      return false;
    };
    Vault.prototype["delete"] = function(id) {
      var index, object, _len, _ref;
      if (this.locked) {
        this.errors.push('Cannot delete, vault is locked.');
        return false;
      }
      _ref = this.objects;
      for (index = 0, _len = _ref.length; index < _len; index++) {
        object = _ref[index];
        if (object[this.options.id_attribute] === id) {
          switch (object.status) {
            case "new":
              this.objects.splice(index, 1);
              this.dirty_object_count--;
              break;
            case "clean":
              object.status = "deleted";
              this.dirty_object_count++;
              break;
            case "dirty":
              object.status = "deleted";
          }
          this.store;
          return true;
        }
      }
      return false;
    };
    Vault.prototype.save = function(after_save) {
      var object, sync_error, _i, _len, _ref, _results;
      if (after_save == null) {
        after_save = function() {};
      }
      if (this.locked) {
        this.errors.push('Cannot save, vault is locked.');
        return after_save();
      } else if (!navigator.onLine) {
        this.errors.push('Cannot save, navigator is offline.');
        return after_save();
      } else if (this.dirty_object_count === 0) {
        this.errors.push('Nothing to save.');
        return after_save();
      }
      this.locked = true;
      this.save_error_count = 0;
      sync_error = false;
      _ref = this.objects;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        object = _ref[_i];
        _results.push(__bind(function(object) {
          switch (object.status) {
            case "deleted":
              return $.ajax({
                type: 'DELETE',
                url: this.urls["delete"],
                data: this.strip(object),
                fixture: function(settings) {
                  return true;
                },
                success: __bind(function(data) {
                  var index, vault_object, _len2, _ref2, _results2;
                  _ref2 = this.objects;
                  _results2 = [];
                  for (index = 0, _len2 = _ref2.length; index < _len2; index++) {
                    vault_object = _ref2[index];
                    _results2.push(vault_object.id === object.id ? (this.objects.splice(index, 1), this.dirty_object_count--) : void 0);
                  }
                  return _results2;
                }, this),
                error: __bind(function() {
                  this.errors.push('Failed to delete.');
                  return this.save_error_count++;
                }, this),
                complete: __bind(function() {
                  if (this.dirty_object_count - this.save_error_count === 0) {
                    this.store;
                    this.locked = false;
                    return after_save();
                  }
                }, this),
                dataType: 'json'
              });
            case "new":
              return $.ajax({
                type: 'POST',
                url: this.urls.create,
                data: this.strip(object),
                fixture: __bind(function(settings) {
                  settings.data.id = this.date.getTime();
                  return settings.data;
                }, this),
                success: __bind(function(data) {
                  object = this.extend(data);
                  return this.dirty_object_count--;
                }, this),
                error: __bind(function() {
                  this.errors.push('Failed to create.');
                  return this.save_error_count++;
                }, this),
                complete: __bind(function() {
                  if (this.dirty_object_count - this.save_error_count === 0) {
                    this.store;
                    this.locked = false;
                    return after_save();
                  }
                }, this),
                dataType: 'json'
              });
            case "dirty":
              return $.ajax({
                type: 'POST',
                url: this.urls.update,
                data: this.strip(object),
                fixture: function(settings) {
                  return true;
                },
                success: __bind(function(data) {
                  object.status = "clean";
                  return this.dirty_object_count--;
                }, this),
                error: __bind(function() {
                  this.errors.push('Failed to update.');
                  return this.save_error_count++;
                }, this),
                complete: __bind(function() {
                  if (this.dirty_object_count - this.save_error_count === 0) {
                    this.store;
                    this.locked = false;
                    return after_save();
                  }
                }, this),
                dataType: 'json'
              });
          }
        }, this)(object));
      }
      return _results;
    };
    Vault.prototype.reload = function(after_load) {
      if (after_load == null) {
        after_load = function() {};
      }
      if (this.locked) {
        this.errors.push('Cannot reload, vault is locked.');
        return after_load();
      } else if (!navigator.onLine) {
        this.errors.push('Cannot reload, navigator is offline.');
        return after_load();
      }
      this.locked = true;
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
          this.dirty_object_count = 0;
          this.store;
          return after_load();
        }, this),
        error: __bind(function() {
          this.errors.push('Failed to list.');
          return after_load();
        }, this),
        complete: __bind(function() {
          return this.locked = false;
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
      return this.save(__bind(function() {
        if (this.errors.length === 0) {
          return this.reload(after_sync);
        } else {
          return after_sync();
        }
      }, this));
    };
    Vault.prototype.load = function() {
      var object, _i, _len, _ref;
      if (!this.options.offline) {
        return false;
      }
      if (localStorage.getItem(this.name)) {
        this.objects = $.parseJSON(localStorage.getItem(this.name));
        _ref = this.objects;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          object = _ref[_i];
          if (object.status !== "clean") {
            this.dirty_object_count++;
          }
        }
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
      object.update = __bind(function() {
        return this.update(object.id);
      }, this);
      object["delete"] = __bind(function() {
        return this["delete"](object.id);
      }, this);
      return object;
    };
    Vault.prototype.strip = function(object) {
      var object_clone;
      object_clone = this.clone(object);
      if (object_clone.status === "new") {
        delete object_clone[this.options.id_attribute];
      }
      delete object_clone.status;
      delete object_clone.update;
      delete object_clone["delete"];
      return object_clone;
    };
    Vault.prototype.clone = function(object) {
      var key, new_instance;
      if (!((object != null) && typeof object === 'object')) {
        return object;
      }
      new_instance = new object.constructor();
      for (key in object) {
        new_instance[key] = this.clone(object[key]);
      }
      return new_instance;
    };
    window.Vault = Vault;
    return Vault;
  })();
}).call(this);
