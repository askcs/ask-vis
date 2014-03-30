'use strict';

angular.module('AskVis', [
  'ngResource'
]).

constant('options', {
    align: 'center',
    autoResize: true,
    editable: true,
    // now: moment().minutes(0).seconds(0).milliseconds(0),
    start: null, // Date | Number | String - now.clone().add('days', -3) - new Date(Date.now() - 1000 * 60 * 60 * 24)
    // start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 31 * 2),
    end: null, // Date | Number | String - now.clone().add('days', 11) - new Date(Date.now() + 1000 * 60 * 60 * 24 * 6)
    // end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 31 * 2),
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
    showCurrentTime: false,
    showCustomTime: false,
    showMajorLabels: true,
    showMinorLabels: true,
    type: 'box', // dot, point
    zoomMin: 10, // 1000 * 60 * 60 * 24,          // a day
    zoomMax: 1000 * 60 * 60 * 24 * 30 * 12 * 3,  // three years
    _zoomMax: 315360000000000 // 10,000 years
  }).

controller('AppCtrl',[
    '$scope', 'Data',
    function ($scope, Data)
    {
      $scope.items = [
        {id: 1, content: 'item 1', start: '2013-04-20'},
        {id: 4, content: 'item 4', start: '2013-04-16', end: '2013-04-19'},
        {id: 5, content: 'item7<br><a href="http://visjs.org" target="_blank">click here</a>', start: '2013-04-25'}
      ];

      $scope.items = {
        team_1: [
          {id: 1, content: 'item 1', start: '2013-04-20'},
          {id: 2, content: 'item 2', start: '2013-04-14'}
        ],
        team_2: [
          {id: 3, content: 'item 3', start: '2013-04-18'},
          {id: 4, content: 'item 4', start: '2013-04-16', end: '2013-04-19'}
        ],
        team_3: [
          {id: 5, content: 'item 5', start: '2013-04-25'},
          {id: 6, content: 'item 6', start: '2013-04-27'}
        ]
      };

      $scope.loadDataSet = function (num)
      {
        Data.fetch('items', { set: num })
          .then(function (result)
          {
            $scope.items = result.items;
          });
      };

      // $scope.loadDataSet(1);

      $scope.customDate = new Date(Date.now()).toISOString().substr(0, 10);

      $scope.timeline = {};



      // var count = 0;
      // for (var k in data) { if (data.hasOwnProperty(k)) { ++count; }}

      // console.log('data is ->', angular.isArray(data), count);







    }
  ]
).

directive('timeLine', [
    'options',
    function (options)
    {
      return {
        restrict: 'E',
        replace: true,
        scope: {
          items: '=',
          timeline: '='
        },
        link: function (scope, element, attrs)
        {

          var callbacks = {
            // Provide a custom sort function to order the items. The order of the items
            // is determining the way they are stacked. The function order is called with
            // two parameters, both of type `vis.components.items.Item`.
            order: function ()
            {
              // console.log('order callback!');
            },

            // String | Function
            // Order the groups by a field name or custom sort function.
            // By default, groups are not ordered.
            groupOrder: function ()
            {
            },

            // Callback function triggered when an item is about to be added:
            // when the user double taps an empty space in the Timeline.
            onAdd: function (item, callback)
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

            // Callback function triggered when an item has been moved:
            // after the user has dragged the item to an other position.
            onMove: function (item, callback)
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

            // Callback function triggered when an item is about to be updated,
            // when the user double taps an item in the Timeline.
            onUpdate: function (item, callback)
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

            // Callback function triggered when an item is about to be removed:
            // when the user tapped the delete button on the top right of a selected item.
            onRemove: function (item, callback)
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
          };

          angular.extend(options, callbacks);




//          var data = new vis.DataSet({
//            convert: {
//              start: 'Date',
//              end: 'Date'
//            }
//          });
//
//          data.on('*', function (event, properties)
//          {
//            // console.log('event=' + JSON.stringify(event) + ', ' + 'properties=' + JSON.stringify(properties));
//          });
//
//          data.add(scope.items);

          // var _timeline = new vis.Timeline(element[0], data, options);





          var groups = new vis.DataSet();

          var items = new vis.DataSet({
            convert: {
              start: 'Date',
              end: 'Date'
            }
          });

          var id = 0;

          // console.log('items ->', scope.items);

          angular.forEach(scope.items, function (_items, _group)
          {
            groups.add({
              id:      id,
              content: _group
            });

            angular.forEach(_items, function (item)
            {
              var _item = {
                id: item.id,
                group: id,
                content: item.content,
                start: item.start
                //,
                //type: 'box'
              };

              if (item.hasOwnProperty('end')) { _item.end = item.end; }

              items.add(_item);
            });

            id++;
          });


          options.groupOrder = 'content';

          var _timeline = new vis.Timeline(element[0]);
          _timeline.setOptions(options);
          _timeline.setGroups(groups);
          _timeline.setItems(items);


//          var now = moment().minutes(0).seconds(0).milliseconds(0);
//          var groupCount = 3;
//          var itemCount = 20;
//
//          // create a data set with groups
//          var names = ['John', 'Alston', 'Lee', 'Grant'];
//
//          var groups = new vis.DataSet();
//
//          for (var g = 0; g < groupCount; g++)
//          {
//            groups.add({id: g, content: names[g]});
//          }
//
//          // create a dataset with items
//          var items = new vis.DataSet();
//
//          for (var i = 0; i < itemCount; i++)
//          {
//            var start = now.clone().add('hours', Math.random() * 200);
//            var group = Math.floor(Math.random() * groupCount);
//
//            items.add({
//              id: i,
//              group: group,
//              content: 'item ' + i +
//                ' <span style="color:#97B0F8;">(' + names[group] + ')</span>',
//              start: start,
//              type: 'box'
//            });
//          }
//
//          options.groupOrder = 'content';
//
//          var _timeline = new vis.Timeline(element[0]);
//          _timeline.setOptions(options);
//          _timeline.setGroups(groups);
//          _timeline.setItems(items);

          console.log('groups ->', groups);

          console.log('items ->', items);








          // scope.$watch('items', function (data) { _timeline.setItems(data) }, true);

          scope.timeline = {
            customDate: _timeline.getCustomTime(),
            setCustomTime: function (time)
            {
              _timeline.setCustomTime(time);

              this.customDate = _timeline.getCustomTime();
            }
          };

          _timeline.on('rangechange', function (period)
          {
            // console.log('rangechange: start -> ', period.start, ' end -> ', period.end);
          });

          _timeline.on('rangechanged', function (period)
          {
            // console.log('rangechanged: start -> ', period.start, ' end -> ', period.end);
          });

          _timeline.on('select', function (selected)
          {
            // console.log('select: items -> ', selected.items);
          });

          _timeline.on('timechange', function (period)
          {
            scope.timeliner.customDate = period.time;

            scope.$apply();
          });

          _timeline.on('timechanged', function (period)
          {
            // console.log('timechanged: -> ', period.time);
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
).

filter('interpolate', [
    'version',
    function (version)
    {
      return function (text)
      {
        return String(text).replace(/\%VERSION\%/mg, version);
      };
    }
  ]
);
