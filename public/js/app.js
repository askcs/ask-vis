'use strict';

angular.module('AskVis', [
  'ngResource'
]).

value('version', '0.1.0').

controller('AppCtrl',[
    '$scope', 'Data',
    function ($scope, Data)
    {
      $scope.items = [
        {id: 1, content: 'item 1', start: '2013-04-20'},
        {id: 2, content: 'item 2', start: '2013-04-14'}
      ];

      Data.fetch('items')
        .then(function (result)
        {
          $scope.items = result.items;
        });
    }
  ]
).

directive('timeLine', [
    function ()
    {
      return {
        restrict: 'E',
        replace: true,
        scope: {
          items: '='
        },
        link: function (scope, element, attrs)
        {
          new vis.Timeline(element[0], scope.items || [], {});
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
