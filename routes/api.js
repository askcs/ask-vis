
exports.items = function (req, res)
{
  var data;

  if (req.query.set == 1)
  {
    data = {
      items: [
        {id: 1, content: 'item 1', start: 1397944800000 /*'2014-04-20'*/},
        {id: 2, content: 'item 2', start: 1397426400000 /*'2014-04-20'*/},
        {id: 3, content: 'item 3', start: 1397772000000 /*'2014-04-18'*/},
        {id: 4, content: 'item 4', start: 1397599200000 /*'2014-04-16'*/, end: 1397858400000 /*'2014-04-19'*/},
        {id: 5, content: 'item 5', start: 1398376800000 /*'2014-04-25'*/},
        {id: 6, content: 'item 6', start: 1398549600000 /*'2014-04-27'*/}
      ]
    };
  }
  else if (req.query.set == 2)
  {
    data = {
      items: {
        team_1: [
          {id: 1, content: 'item 1', start: 1397944800000 /*'2014-04-20'*/},
          {id: 2, content: 'item 2', start: 1397426400000 /*'2014-04-20'*/}
        ],
        team_2: [
          {id: 3, content: 'item 3', start: 1397772000000 /*'2014-04-18'*/},
          {id: 4, content: 'item 4', start: 1397599200000 /*'2014-04-16'*/, end: 1397858400000 /*'2014-04-19'*/}
        ],
        team_3: [
          {id: 5, content: 'item 5', start: 1398376800000 /*'2014-04-25'*/},
          {id: 6, content: 'item 6', start: 1398549600000 /*'2014-04-27'*/}
        ]
      }
    };
  }

  res.json(data);
};