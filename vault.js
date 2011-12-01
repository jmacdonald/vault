(function() {
  var Vault;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Vault = (function() {
    function Vault(name, urls, options) {
      var option, sub_collection, value, _fn, _i, _len, _ref;
      this.name = name;
      this.urls = urls;
      if (options == null) {
        options = {};
      }
      this.objects = [];
      this.dirty_object_count = 0;
      this.errors = [];
      this.save_error_count = 0;
      this.locked = false;
      this.date = new Date;
      this.options = {
        autoload: true,
        after_load: function() {},
        id_attribute: "id",
        offline: false,
        sub_collections: []
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
              window.setTimeout(this.options.after_load, 100);
            } else {
              if (this.urls.list != null) {
                this.reload(this.options.after_load);
              } else {
                this.options.after_load();
              }
            }
          } else {
            if (navigator.onLine) {
              if (this.urls.list != null) {
                this.reload(this.options.after_load);
              } else {
                this.options.after_load();
              }
            } else {
              this.errors.push("Offline data failed to load. Could not load live data as browser is offline.");
            }
          }
        } else {
          if (this.urls.list != null) {
            this.reload(this.options.after_load);
          } else {
            this.options.after_load();
          }
        }
      }
      _ref = this.options.sub_collections;
      _fn = __bind(function(sub_collection) {
        return this[sub_collection] = {
          'find': __bind(function(id) {
            var object, sub_object, _j, _k, _len2, _len3, _ref2, _ref3;
            _ref2 = this.objects;
            for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
              object = _ref2[_j];
              _ref3 = object[sub_collection];
              for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
                sub_object = _ref3[_k];
                if (sub_object[this.options.id_attribute].toString() === id.toString()) {
                  return sub_object;
                }
              }
            }
            return false;
          }, this)
        };
      }, this);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        sub_collection = _ref[_i];
        _fn(sub_collection);
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
      if (!((object[this.options.id_attribute] != null) && object[this.options.id_attribute] !== '')) {
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
        if (object[this.options.id_attribute].toString() === id.toString()) {
          return object;
        }
      }
      return false;
    };
    Vault.prototype.update = function(attributes, id) {
      var attribute, object, value;
      if (this.locked) {
        this.errors.push('Cannot update, vault is locked.');
        return false;
      }
      if (id == null) {
        id = attributes[this.options.id_attribute];
      }
      object = this.find(id);
      if (object == null) {
        this.errors.push('Cannot update, object not found.');
        return false;
      }
      if (object.status === "clean") {
        object.status = "dirty";
        this.dirty_object_count++;
      }
      if (attributes != null) {
        for (attribute in attributes) {
          value = attributes[attribute];
          if (object[attribute] != null) {
            object[attribute] = value;
          }
        }
      }
      this.store;
      return true;
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
    Vault.prototype.destroy = function(id) {
      var index, object, _len, _ref;
      if (this.locked) {
        this.errors.push('Cannot delete, vault is locked.');
        return false;
      }
      _ref = this.objects;
      for (index = 0, _len = _ref.length; index < _len; index++) {
        object = _ref[index];
        if (object[this.options.id_attribute] === id) {
          this.objects.splice(index, 1);
          switch (object.status) {
            case "new":
            case "dirty":
              this.dirty_object_count--;
          }
          this.store;
          return true;
        }
      }
      return false;
    };
    Vault.prototype.save = function(id, after_save) {
      var object, packaged_object;
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
      object = this.find(id);
      packaged_object = {};
      packaged_object[this.name] = JSON.stringify(this.strip(object));
      switch (object.status) {
        case "deleted":
          return $.ajax({
            type: 'DELETE',
            url: this.urls["delete"],
            data: packaged_object,
            fixture: function(settings) {
              return true;
            },
            success: __bind(function(data) {
              var index, vault_object, _len, _ref, _results;
              _ref = this.objects;
              _results = [];
              for (index = 0, _len = _ref.length; index < _len; index++) {
                vault_object = _ref[index];
                _results.push(vault_object.id === object.id ? (this.objects.splice(index, 1), this.dirty_object_count--) : void 0);
              }
              return _results;
            }, this),
            error: __bind(function() {
              return this.errors.push('Failed to delete.');
            }, this),
            complete: __bind(function() {
              this.store;
              this.locked = false;
              return after_save();
            }, this),
            dataType: 'json'
          });
        case "new":
          return $.ajax({
            type: 'POST',
            url: this.urls.create,
            data: packaged_object,
            fixture: __bind(function(settings) {
              return {
                id: 123,
                make: "Dodge",
                model: "Viper SRT-10",
                year: 2008
              };
            }, this),
            success: __bind(function(data) {
              this.locked = false;
              object.update(data, object.id);
              object.status = "clean";
              return this.dirty_object_count--;
            }, this),
            error: __bind(function() {
              return this.errors.push('Failed to create.');
            }, this),
            complete: __bind(function() {
              this.store;
              this.locked = false;
              return after_save();
            }, this),
            dataType: 'json'
          });
        case "dirty":
          return $.ajax({
            type: 'POST',
            url: this.urls.update,
            data: packaged_object,
            fixture: function(settings) {
              return true;
            },
            success: __bind(function(data) {
              object.status = "clean";
              return this.dirty_object_count--;
            }, this),
            error: __bind(function() {
              return this.errors.push('Failed to update.');
            }, this),
            complete: __bind(function() {
              this.store;
              this.locked = false;
              return after_save();
            }, this),
            dataType: 'json'
          });
      }
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
      } else if (!(this.urls.list != null)) {
        this.errors.push('Cannot reload, list url is not configured.');
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
      var object, _i, _j, _len, _len2, _ref, _ref2;
      if (!this.options.offline) {
        return false;
      }
      if (localStorage.getItem(this.name)) {
        this.objects = $.parseJSON(localStorage.getItem(this.name));
        _ref = this.objects;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          object = _ref[_i];
          this.extend(object);
        }
        _ref2 = this.objects;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          object = _ref2[_j];
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
      var sub_collection, _fn, _i, _len, _ref;
      if (status != null) {
        if (status !== 'clean' && status !== 'dirty' && status !== 'new') {
          throw "Invalid status specified: cannot extend object.";
        }
      }
      object.update = __bind(function(attributes) {
        return this.update(attributes, object.id);
      }, this);
      object["delete"] = __bind(function() {
        return this["delete"](object.id);
      }, this);
      object.destroy = __bind(function() {
        return this.destroy(object.id);
      }, this);
      object.save = __bind(function(after_save) {
        return this.save(object.id, after_save);
      }, this);
      if (status != null) {
        object.status = status;
      } else {
        if (object.status == null) {
          object.status = "clean";
        }
      }
      _ref = this.options.sub_collections;
      _fn = __bind(function(sub_collection) {
        var index, sub_object, _j, _len2, _len3, _ref2, _ref3, _results;
        if (object[sub_collection] != null) {
          object[sub_collection].find = __bind(function(id) {
            var sub_collection_object, _j, _len2, _ref2;
            _ref2 = object[sub_collection];
            for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
              sub_collection_object = _ref2[_j];
              if (sub_collection_object[this.options.id_attribute].toString() === id.toString()) {
                return sub_collection_object;
              }
            }
            return false;
          }, this);
          object[sub_collection].add = __bind(function(sub_object) {
            if (this.locked) {
              this.errors.push('Cannot add sub-object, vault is locked.');
              return false;
            }
            sub_object.status = "new";
            if (!((sub_object[this.options.id_attribute] != null) && sub_object[this.options.id_attribute] !== '')) {
              sub_object[this.options.id_attribute] = this.date.getTime();
            }
            sub_object["delete"] = __bind(function() {
              return object[sub_collection]["delete"](sub_object[this.options.id_attribute]);
            }, this);
            sub_object.update = __bind(function(attributes) {
              return object[sub_collection].update(attributes, sub_object[this.options.id_attribute]);
            }, this);
            object[sub_collection].push(sub_object);
            if (object.status === "clean") {
              object.status = "dirty";
              this.dirty_object_count++;
            }
            this.store;
            return sub_object;
          }, this);
          object[sub_collection]["delete"] = __bind(function(id) {
            var index, sub_object, _len2, _ref2;
            if (this.locked) {
              this.errors.push('Cannot delete sub-object, vault is locked.');
              return false;
            }
            _ref2 = object[sub_collection];
            for (index = 0, _len2 = _ref2.length; index < _len2; index++) {
              sub_object = _ref2[index];
              if (sub_object[this.options.id_attribute] === id) {
                object[sub_collection].splice(index, 1);
              }
            }
            if (object.status === "clean") {
              object.status = "dirty";
              this.dirty_object_count++;
            }
            return this.store;
          }, this);
          _ref2 = object[sub_collection];
          for (index = 0, _len2 = _ref2.length; index < _len2; index++) {
            sub_object = _ref2[index];
            sub_object["delete"] = __bind(function() {
              return object[sub_collection]["delete"](sub_object[this.options.id_attribute]);
            }, this);
          }
          object[sub_collection].update = __bind(function(attributes, id) {
            var attribute, value;
            if (this.locked) {
              this.errors.push('Cannot update sub-object, vault is locked.');
              return false;
            }
            if (id == null) {
              id = attributes[this.options.id_attribute];
            }
            sub_object = object[sub_collection].find(id);
            if (sub_object == null) {
              this.errors.push('Cannot update, sub-object not found.');
              return false;
            }
            if (object.status === "clean") {
              object.status = "dirty";
              this.dirty_object_count++;
            }
            if (attributes != null) {
              for (attribute in attributes) {
                value = attributes[attribute];
                if (sub_object[attribute] != null) {
                  sub_object[attribute] = value;
                }
              }
            }
            return this.store;
          }, this);
          _ref3 = object[sub_collection];
          _results = [];
          for (_j = 0, _len3 = _ref3.length; _j < _len3; _j++) {
            sub_object = _ref3[_j];
            _results.push(__bind(function(sub_object) {
              return sub_object.update = __bind(function(attributes) {
                return object[sub_collection].update(attributes, sub_object[this.options.id_attribute]);
              }, this);
            }, this)(sub_object));
          }
          return _results;
        }
      }, this);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        sub_collection = _ref[_i];
        _fn(sub_collection);
      }
      return object;
    };
    Vault.prototype.strip = function(object) {
      var object_clone, sub_collection, sub_object, _i, _j, _len, _len2, _ref, _ref2;
      object_clone = this.clone(object);
      if (object_clone.status === "new") {
        delete object_clone[this.options.id_attribute];
      }
      delete object_clone.status;
      delete object_clone.update;
      delete object_clone["delete"];
      delete object_clone.destroy;
      delete object_clone.save;
      _ref = this.options.sub_collections;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        sub_collection = _ref[_i];
        if (object_clone[sub_collection] != null) {
          delete object_clone[sub_collection].find;
          delete object_clone[sub_collection].add;
          delete object_clone[sub_collection]["delete"];
          delete object_clone[sub_collection].update;
          _ref2 = object_clone[sub_collection];
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            sub_object = _ref2[_j];
            if (sub_object.status === "new") {
              delete sub_object[this.options.id_attribute];
            }
            delete sub_object.status;
            delete sub_object["delete"];
            delete sub_object.update;
          }
        }
      }
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
