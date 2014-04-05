'use strict';

angular.module('NgVis', []).

  constant('options', {
    debug: false,
    align: 'center',
    autoResize: true,
    editable: true,
    start: null,
    end: null,
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




  directive('timeLine', [
    'options',
    function (options)
    {
      return {
        restrict: 'E',
        replace:  true,
        transclude: true,
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

          angular.extend(scope.timeline, {

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
          });

          _timeline.on('rangechange', function (period)
          {
            scope.timeline.rangeChange(period);
          });

          _timeline.on('rangechanged', function (period)
          {
            scope.timeline.rangeChanged(period);
          });

          _timeline.on('select', function (selected)
          {
            scope.timeline.select(selected);
          });

          _timeline.on('timechange', function (period)
          {
            scope.timeline.timeChange(period);
          });

          _timeline.on('timechanged', function (period)
          {
            scope.timeline.timeChanged(period);
          });
        }
      }
    }
  ]).




  directive('timeBoard', [
    function ()
    {
      return {
        restrict: 'E',
        replace:  false,
        scope: {
          timeline: '='
        },
        controller: function ($scope)
        {
          var range = {
            apart: function (date)
            {
              return {
                year:   moment(date).get('year'),
                month:  moment(date).get('month'),
                date:   moment(date).get('date'),
                hour:   moment(date).get('hour'),
                minute: moment(date).get('minute'),
                second: moment(date).get('second')
              }
            },

            analyse: function (period)
            {
              var p = {
                s:  this.apart(period.start),
                e:  this.apart(period.end)
              };

              var info = '';

              if (p.s.year == p.e.year)
              {
                info += 'years same - ';

                if (p.s.month == p.e.month)
                {
                  info += 'months same - ';

                  if (p.s.date == p.e.date)
                  {
                    info += 'dates same - ';

                    if (p.s.hour == p.e.hour)
                    {
                      info += 'hour same - ';

                      if (p.s.minute == p.e.minute)
                      {
                        info += 'minute same - ';

                        if (p.s.second == p.e.second)
                        {
                          info += 'seconds same - ';
                        }
                        else
                        {
                          info += 'seconds diff!  - ';
                        }
                      }
                      else
                      {
                        info += 'minute diff!  - ';
                      }
                    }
                    else
                    {
                      info += 'hour diff!  - ';
                    }
                  }
                  else
                  {
                    info += 'dates diff!  - ';
                  }
                }
                else
                {
                  info += 'months diff!  - ';
                }
              }
              else
              {
                info += 'years diff! - ';
              }

              return info;
            },

            indicate: function (period)
            {
              return this.analyse(period);
            }
          };

          $scope.$watch('timeline.range', function (period)
          {
              $scope.timeline.info = range.indicate(period);
          });
        }
      }
    }
  ]).





  directive('timeNav', [
    function ()
    {
      return {
        restrict: 'E',
        replace:  false,
        scope: {
          timeline: '='
        },
        controller: function ($scope)
        {
          var start = 0;

          $scope.timeline.setScope = function (scope)
          {
            $scope.timeline.scope = {
              day: false,
              week: false,
              month: false,
              year: false
            };

            $scope.timeline.scope[scope] = true;

            $scope.timeline.setWindow(
              moment().startOf(scope),
              moment().endOf(scope)
            );

            start = 0;
          };

          var scope;

          $scope.timeline.stepScope = function (direction)
          {
            start = start + direction;

            angular.forEach($scope.timeline.scope, function (active, _scope)
            {
              if (active) scope = _scope;
            });

            $scope.timeline.setWindow(
              moment().add(scope, start).startOf(scope),
              moment().add(scope, start).endOf(scope)
            );
          };

          setTimeout(function ()
          {
            $scope.timeline.setScope('month');
          }, 25);
        }
      }
    }
  ]);







function parseStamp (range)
{
  if (range)
  {
    var format = 'dddd, MMMM Do YYYY, h:mm:ss a';

    var start = moment(range.start).format(format);
    var end = moment(range.end).format(format);

    return start + ' - ' + end;
  }
}