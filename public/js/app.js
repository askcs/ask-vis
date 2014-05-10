'use strict';

// TODO list
// - Add a slot form to add or update existing slots
// - Interaction between the slot form and timeline interactively
// - Collect information while the custom time line dragged
// - Show popup info for get functions

angular.module('AskVis', ['ngResource', 'NgVis']).

  controller(
  'AppCtrl', [
    '$scope', 'Data',
    function ($scope, Data)
    {
      var debug = false;

      $scope.items = [];

      $scope.loadDataSet = function (num)
      {
        Data.fetch(
          'items',
          { set: num })
          .then(
          function (result)
          {
            $scope.items = result.items;
          }
        );
      };

      $scope.loadDataSet(2);

      $scope.simplifyItems = function (items)
      {
        var simplified = [];

        angular.forEach(
          items,
          function (group, label)
          {
            angular.forEach(
              group,
              function (item)
              {
                item.group = label;

                simplified.push(item);
              });
          }
        );

        return simplified;
      };

      /**
       * Timeline stuff
       */
      $scope.timeline = {

        select: function (selected)
        {
          if (debug)
          {
            console.log('selected items: ', selected.items);
          }

          var items = $scope.simplifyItems($scope.items);

          var format = 'YYYY-MM-DDTHH:mm';

          angular.forEach(
            items,
            function (item)
            {
              if (item.id == selected.items[0])
              {
                $scope.slot = {
                  id:      item.id,
                  start:   moment(item.start).format(format),
                  end: (item.end) ? moment(item.end).format(format) : null,
                  content: item.content
                };

                $scope.$apply();
              }
            }
          );
        },

        range: {},

        rangeChange: function (period)
        {
          this.range = $scope.timeline.getWindow();

          if (! $scope.$$phase)
          {
            $scope.$apply();
          }

          if (debug)
          {
            console.log(
              'rangeChange: start-> ',
              period.start, ' end-> ', period.end);
          }
        },

        rangeChanged: function (period)
        {
          if (debug)
          {
            console.log(
              'rangeChange(d): start-> ',
              period.start, ' end-> ', period.end);
          }
        },

        customTime: null,

        timeChange: function (period)
        {
          if (debug)
          {
            console.log('timeChange: ', period.time);
          }

          $scope.$apply(
            function ()
            {
              $scope.timeline.customTime = period.time;
            }
          );
        },

        timeChanged: function (period)
        {
          if (debug)
          {
            console.log('timeChange(d): ', period.time);
          }
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
            if (confirm(
                'Do you really want to move the item to\n' +
                'start: ' + item.start + '\n' +
                'end: ' + item.end + '?'))
            {
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

  factory(
  'Data', [
    '$resource', '$q',
    function ($resource, $q)
    {
      var Data = $resource(
        '/:action/:level',
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
        catch (err)
        { console.warn('Error!: ', err); }

        return deferred.promise;
      };

      return new Data();
    }
  ]
);