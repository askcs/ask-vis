'use strict';

// TODO list
// - Add a slot form to add or update existing slots
// - Interaction between the slot form and timeline interactively
// - Collect information while the custom time line dragged
// - Show popup info for get functions

angular.module('AskVis', ['ngResource', 'NgVis']).

controller('AppCtrl', [
    '$scope', 'Data', 'Store',
    function ($scope, Data, Store)
    {
      var debug = false;

      Store = Store('data');

      /**
       * Data
       */
      $scope.items = [];

      $scope.loadDataSet = function (num)
      {
        Data.fetch('items', { set: num })
          .then(function (result)
          {
            Store.save(result, 'items');

            $scope.items = result.items;
          });
      };

      Store.get('items', function (data)
      {
        if (data.hasOwnProperty('items'))
        {
          $scope.items = data.items;
        }
        else
        {
          $scope.loadDataSet(2);
        }
      });

      $scope.simplifyItems = function (items)
      {
        var simplified = [];

        angular.forEach(items, function (group, label)
        {
          angular.forEach(group, function (item)
          {
            item.group = label;

            simplified.push(item);
          });
        });

        return simplified;
      };

      /**
       * Timeline stuff
       */
      $scope.timeline = {

        select: function (selected)
        {
          if (debug)
            console.log('selected items: ', selected.items);

          var items = $scope.simplifyItems($scope.items);

          var format = 'YYYY-MM-DDTHH:mm';

          angular.forEach(items, function (item)
          {
            if (item.id == selected.items[0])
            {
              $scope.slot = {
                id:     item.id,
                start:  moment(item.start).format(format),
                end:    (item.end) ? moment(item.end).format(format) : null,
                content:item.content
              };

              $scope.$apply();
            }
          });
        },

        range: {},

        rangeChange: function (period)
        {
          this.range = $scope.timeline.getWindow();

          if (!$scope.$$phase) { $scope.$apply(); }

          if (debug)
            console.log('rangeChange: start-> ',
              period.start, ' end-> ', period.end);
        },

        rangeChanged: function (period)
        {
          if (debug)
            console.log('rangeChange(d): start-> ',
              period.start, ' end-> ', period.end);
        },

        customTime: null,

        timeChange: function (period)
        {
          if (debug)
            console.log('timeChange: ', period.time);

          $scope.$apply(function ()
          {
            $scope.timeline.customTime = period.time;
          });
        },

        timeChanged: function (period)
        {
          if (debug)
            console.log('timeChange(d): ', period.time);
        },

        slot: {
          add: function (item, callback)
          {
            item.content = prompt('Enter text content for new item:', item.content);

            if (item.content != null)
            {
              callback(item); // send back adjusted new item
            }
            else
            {
              callback(null); // cancel item creation
            }
          },

          move: function (item, callback)
          {
            if (confirm('Do you really want to move the item to\n' +
              'start: ' + item.start + '\n' +
              'end: ' + item.end + '?')) {
              callback(item); // send back item as confirmation (can be changed
            }
            else
            {
              callback(null); // cancel editing item
            }
          },

          update: function (item, callback)
          {
            item.content = prompt('Edit items text:', item.content);

            if (item.content != null)
            {
              callback(item); // send back adjusted item
            }
            else
            {
              callback(null); // cancel updating the item
            }
          },

          remove: function (item, callback)
          {
            if (confirm('Remove item ' + item.content + '?'))
            {
              callback(item); // confirm deletion
            }
            else
            {
              callback(null); // cancel deletion
            }
          }
        }
      };

      /**
       * Slot actions
       */
      $scope.actions = {
        save: function ()
        {
          var items = $scope.items;

          angular.forEach(items, function (group)
          {
            angular.forEach(group, function (item)
            {
              if (item.id == $scope.slot.id)
              {
                item.start    = $scope.slot.start;
                item.end      = $scope.slot.end;
                item.content  = $scope.slot.content;
              }
            })
          });

          $scope.items = items;

          Store.save(items, 'items');
        }
      }

      $scope.getCustomTime = function ()
      {
        $scope.gotCustomDate = $scope.timeline.getCustomTime();
      };

      $scope.getSelection = function ()
      {
        $scope.gotSelection = $scope.timeline.getSelection();
      };

      $scope.setSelection = function (selection)
      {
        selection = (angular.isArray(selection)) ? selection : [].concat(selection);

        $scope.timeline.setSelection(selection);
      };

      $scope.getWindow = function ()
      {
        $scope.gotWindow = $scope.timeline.getWindow();
      };

      $scope.setWindow = function (start, end)
      {
        $scope.timeline.setScope('custom');

        $scope.timeline.setWindow(start, end);
      };

      $scope.setOptions = function (options)
      {
        $scope.timeline.setOptions(options);
      };
    }
  ]
).

factory('Data', [
    '$resource', '$q',
    function ($resource, $q)
    {
      var Data = $resource('/:action/:level',
        {},
        {
          items: {
            method: 'GET',
            params: {
              action: 'api',
              level:  'items'
            }
          }
        }
      );

      Data.prototype.fetch = function (proxy, params, data, callback)
      {
        var deferred = $q.defer();

        params = params || {};

        try
        {
          Data[proxy](
            params,
            data,
            function (result)
            {
              if (callback && callback.success) callback.success.call(this, result);

              deferred.resolve(result);
            },
            function (result)
            {
              if (callback && callback.error) callback.error.call(this, result);

              deferred.resolve({error: result});
            }
          );
        }
        catch (err) { console.warn('Error!: ', err); }

        return deferred.promise;
      };

      return new Data();
    }
  ]
).

factory('Store', [
  '$window', '$log', '$parse',
    function($window, $log, $parse)
    {
      return function (name, config)
      {
        var LawnChair,
            Store,
            allAsArray,
            allAsCollection,
            array,
            collection,
            getDefault,
            getEntryId,
            idGetter,
            isArray,
            removeEntry,
            saveEntry,
            transformLoad,
            transformSave,
            updateArray,
            updateCache,
            updateCacheFromStorage;

        getEntryId = function (entry)
        {
          var e;

          try
          {
            return idGetter(entry);
          }
          catch (_error)
          {
            e = _error;
            return null;
          }
        };

        LawnChair = function (callback)
        {
          return new Lawnchair({
            name: name
          }, callback);
        };

        saveEntry = function (data, key)
        {
          var e, update;

          key = key.toString();

          if (angular.isObject(data) && data !== collection[key])
          {
            collection[key] = collection[key] || {};
            angular.extend(collection[key], data);
          }
          else
          {
            collection[key] = data;
          }

          update = {
            key: key,
            value: transformSave(collection[key])
          };

          try
          {
            LawnChair(function() {
              this.save(update);
            });
          }
          catch (_error)
          {
            e = _error;

            if (e.name === 'QUOTA_EXCEEDED_ERR' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
            {
              $window.localStorage.clear();
            }

            $log.info('LocalStorage Exception ==> ' + e.message);
          }
        };

        updateArray = function (data)
        {
          array.length = 0;

          _.each(data, function(o)
          {
            array.push(o);
          });

          return array;
        };

        updateCache = function (obj, key)
        {
          if (obj && angular.isObject(obj) && collection[key] && collection[key] !== obj)
          {
            angular.extend(collection[key], obj);
          }
          else
          {
            collection[key] = obj;
          }
        };

        updateCacheFromStorage = function (cache, storage)
        {
          if (storage)
          {
            if (angular.isObject(storage.value) && angular.isObject(cache))
            {
              angular.extend(cache, transformLoad(storage.value));
            }
            else
            {
              cache = transformLoad(storage.value);
            }

            updateCache(cache, storage.key);
          }

          return cache;
        };

        allAsCollection = function (callback)
        {
          LawnChair(function()
          {
            this.all(function(result)
            {
              angular.forEach(result, function (o)
              {
                updateCache(o.value, o.key);
              });

              if (callback)
              {
                callback(collection);
              }
            });
          });

          return collection;
        };

        allAsArray = function (callback)
        {
          return updateArray(allAsCollection(function (data)
          {
            updateArray(data);

            if (callback)
              callback(array);
          }));
        };

        removeEntry = function (key)
        {
          delete collection[key];

          LawnChair(function ()
          {
            this.remove(key);
          });
        };

        getDefault = function (key)
        {
          var d;

          if (collection[key])
          {
            return collection[key];
          }
          else
          {
            d = {};

            idGetter.assign(d, key);

            return d;
          }
        };

        collection = {};

        array = [];

        isArray = config && config.isArray;
        idGetter = $parse((config && config.entryKey ? config.entryKey : 'id'));

        // TODO: Still needed? since there is no config anymore
        transformSave = (config && config.transformSave ? config.transformSave : angular.identity);
        transformLoad = (config && config.transformLoad ? config.transformLoad : angular.identity);

        Store = {
          collection: collection,

          save: function (data, key, clear)
          {
            var newIds;

            if (!data)
            {
              data = collection;
              key = null;
            }

            if (angular.isArray(data))
            {
              angular.forEach(data, function (e, index)
              {
                saveEntry(e, getEntryId(e) || index);
              });
            }
            else if (key || (data && getEntryId(data)))
            {
              saveEntry(data, key || getEntryId(data));
            }
            else
            {
              angular.forEach(data, saveEntry);
            }

            if (clear)
            {
              newIds = (angular.isArray(data) ?
                        _.chain(data).map(getEntryId).map(String).value() :
                        _.keys(data));

              _.chain(collection)
                .keys()
                .difference(newIds)
                .each(removeEntry);

              _.chain(collection)
                .filter(function (entry)
                {
                  return !getEntryId(entry);
                }
              ).keys().each(removeEntry);
            }

            if (isArray)
            {
              updateArray(collection);
            }
          },

          batch: function (keys, target, callback)
          {
            var cache;

            cache = _.chain(keys).map(function (k)
            {
              return getDefault(k);
            }).value();

            if (target && angular.isArray(target))
            {
              target.length = 0;

              _.each(cache, function (o)
              {
                target.push(o);
              });
            }
            else
            {
              target = cache;
            }

            LawnChair(function ()
            {
              this.get(keys, function (result)
              {
                var i;

                if (result)
                {
                  i = result.length - 1;

                  while (i >= 0)
                  {
                    target[i] = updateCacheFromStorage(target[i], result[i]);

                    i--;
                  }
                }
                if (callback)
                  callback(target);
              });
            });
            return target;
          },

          get: function (key, callback)
          {
            var value;

            value = getDefault(key);

            LawnChair(function ()
            {
              this.get(key, function (result)
              {
                if (result)
                  value = updateCacheFromStorage(value, result);

                if (callback)
                  callback(value);
              });
            });

            return value;
          },

          all: (isArray ? allAsArray : allAsCollection),

          remove: removeEntry,

          nuke: function ()
          {
            LawnChair(function()
            {
              this.nuke();
            });
          },

          destroy: function ()
          {
            var key;

            for (key in collection)
              delete collection[key];

            LawnChair(function ()
            {
              this.nuke();
            });
          }
        };

        return Store;
      };
    }
]);