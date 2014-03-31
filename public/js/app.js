'use strict';

angular.module('AskVis', ['ngResource']).

constant('options', {
    debug: false,
    align: 'center',
    autoResize: true,
    editable: true,
    start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21),
    end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6),
    height: null,
    width: '100%',
    margin: {
      axis: 20,
      item: 10
    },
    max: null,
    maxHeight: null,
    min: null,
    orientation: 'bottom',
    padding: 5,
    selectable: true,
    showCurrentTime: true,
    showCustomTime: true,
    showMajorLabels: true,
    showMinorLabels: true,
    type: 'box', // dot, point
    zoomMin: 1000, // a second
    zoomMax: 1000 * 60 * 60 * 24 * 30 * 12 * 3  // three years
  }).

controller('AppCtrl',[
    '$scope', 'Data',
    function ($scope, Data)
    {
      $scope.items = [];

      $scope.loadDataSet = function (num)
      {
        Data.fetch('items', { set: num })
          .then(function (result)
          {
            $scope.items = result.items;
          });
      };

      $scope.loadDataSet(1);

      $scope.customDate = new Date(Date.now()).toISOString().substr(0, 10);

      $scope.timeline = {
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
        var _selection = [].concat(selection);

        $scope.timeline.setSelection(_selection);
      };

      $scope.getWindow = function ()
      {
        $scope.gotWindow = $scope.timeline.getWindow();
      };

      $scope.setWindow = function (start, end)
      {
        $scope.timeline.setWindow(start, end);
      };

      $scope.setOptions = function (options)
      {
        $scope.timeline.setOptions(options);
      };

      // now: moment().minutes(0).seconds(0).milliseconds(0)
      // now.clone().add('days', -3)
    }
  ]
).

directive('timeLine', [
    'options',
    function (options)
    {
      return {
        restrict: 'E',
        replace:  true,
        scope: {
          items:     '=',
          timeline:  '='
        },
        link: function (scope, element, attrs)
        {
          var callbacks = {
            onAdd:    scope.timeline.slot.add,
            onMove:   scope.timeline.slot.move,
            onUpdate: scope.timeline.slot.update,
            onRemove: scope.timeline.slot.remove
          };

          options.order       = function () {};
          options.groupOrder  = 'content'; // function () {};

          angular.extend(options, callbacks);

          var _timeline = new vis.Timeline(element[0]);

          _timeline.setOptions(options);

          function render (data)
          {
            var groups = new vis.DataSet();

            var items = new vis.DataSet({
              convert: {
                start:'Date',
                end:  'Date'
              }
            });

            items.on('*', function (event, properties)
            {
              if (options.debug)
                console.log('event=' +
                  angular.toJson(event) + ', ' +
                  'properties=' + angular.toJson(properties));
            });

            if (angular.isArray(data))
            {
              items.add(data);
            }
            else
            {
              var id = 0;

              angular.forEach(data, function (_items, _group)
              {
                groups.add({
                  id:      id,
                  content: _group
                });

                angular.forEach(_items, function (item)
                {
                  var _item = {
                    id:     item.id,
                    group:  id,
                    content:item.content,
                    start:  item.start
                  };

                  if (item.hasOwnProperty('end')) { _item.end = item.end; }

                  items.add(_item);
                });

                id++;
              });

              _timeline.setGroups(groups);
            }

            _timeline.setItems(items);
          }

          scope.$watch('items', function (data) { render(data); }, true);

          scope.timeline = {

            customDate: _timeline.getCustomTime(),

            getSelection: function ()
            {
              return _timeline.getSelection();
            },

            setSelection: function (selection)
            {
              return _timeline.setSelection(selection);
            },

            getWindow: function ()
            {
              return _timeline.getWindow();
            },

            setWindow: function (start, end)
            {
              return _timeline.setWindow(start, end);
            },

            getCustomTime: function ()
            {
              return _timeline.getCustomTime();
            },

            setCustomTime: function (time)
            {
              _timeline.setCustomTime(time);

              this.customDate = _timeline.getCustomTime();
            },

            setOptions: function (options)
            {
              _timeline.setOptions(options);
            }
          };

          _timeline.on('rangechange', function (period)
          {
            if (options.debug)
              console.log('rangechange: start -> ', period.start, ' end -> ', period.end);
          });

          _timeline.on('rangechanged', function (period)
          {
            if (options.debug)
              console.log('rangechanged: start -> ', period.start, ' end -> ', period.end);
          });

          _timeline.on('select', function (selected)
          {
            if (options.debug)
              console.log('select: items -> ', selected.items);
          });

          _timeline.on('timechange', function (period)
          {
            scope.timeline.customDate = period.time;

            scope.$apply();
          });

          _timeline.on('timechanged', function (period)
          {
            if (options.debug)
              console.log('timechanged: -> ', period.time);
          });
        }
      }
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
);