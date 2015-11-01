var maxCount = 0;
var totalCount = 0;

// ADD PAGE ELEMENTS
var upperContainer = document.getElementById('upper-content');
var chartContainer = document.getElementById('chart');
var width = chartContainer.offsetWidth;
var height = window.innerHeight - chartContainer.offsetHeight;

var chartDimension = Math.min(width, height);
var leftAdjust = Math.max(0, (width - chartDimension)/2);
var topAdjust = 0;

var svg = d3.select('#chart').append('svg')
  .attr('width', width).attr('height', height)
  .append('g')
    .attr('id','chart-container')
    .attr('transform', 'translate(' + leftAdjust + ',' + topAdjust + ')');

// SETUP THE D3 EQUATIONS
var xScale = d3.scale.linear().range([0, chartDimension]);
var yScale = d3.scale.linear().range([chartDimension / 2, 0]);
// var line = d3.svg.line().interpolate('cardinal')
//   .x(function(d){return xScale( getIncomeIndex(d.income) )})
//   .y(function(d){return yScale(d.count);})

var area = d3.svg.area().interpolate('cardinal')
  .x(function(d){return xScale(d.originalIndex);})
  .y0(0)
  .y1(function(d){return yScale(d.count);})

d3.csv('data.csv', formatCSVData, processData);

function formatCSVData(IrsCsv, index){
  totalCount += +IrsCsv.count;
  maxCount = Math.max(maxCount, IrsCsv.count);

  var threshold = IrsCsv.range.split(' to ') || IrsCsv.range;
  var lowerThreshold = +threshold[0].slice(1).split(',').join('');
  var upperThreshold = +threshold[1].slice(1).split(',').join('');
  return {
    text: IrsCsv.range.split(' to ')[0],
    lowerThreshold: lowerThreshold,
    upperThreshold: upperThreshold || Infinity,
    count: +IrsCsv.count,
    originalIndex: index
  }
}

function processData(err, irsData){
  console.log(totalCount)
  console.log(irsData)

  updateD3Functions(irsData);
  initialRender(irsData)
}

function updateD3Functions(irsData){
  xScale.domain([0, irsData.length - 1]);
  yScale.domain([0, maxCount * 1.2]);
}

function initialRender(irsData){
  d3.select('#chart-container')
    .append('g')
      .attr({
        'class': 'outline circles',
        'fill': 'none',
        'stroke': '#bab8af',
        'stroke-width': 1
      })
      .selectAll('.outline .circle').data(irsData).enter()
      .append('circle')
        .attr({
          'class': 'outline circle',
          'r': function(d){return xScale(d.originalIndex)/2;},
          'cx': function(d){return xScale(d.originalIndex)/2;},
          'cy': chartDimension/2,
          'opacity': 0.20
        })

  d3.select('#chart-container')
    .append('circle')
      .attr({
        'class': 'salary circle',
        'fill': 'RGBA(0, 140, 112, ' + (0.5 + 0.5 * 0.3) + ')',
        'r': function(d){return xScale(16.9)/2;},
        'cx': function(d){return xScale(16.9)/2;},
        'cy': chartDimension/2
      })

  d3.select('#chart-container')
    .append('rect')
      .attr({
        'class': 'cover white',
        'x': 0,
        'y': 0,
        'width': chartDimension,
        'height': chartDimension / 2,
        'fill': 'white',
      })

  d3.select('#chart-container')
    .append('rect')
      .attr({
        'class': 'cover green',
        'x': 0,
        'y': 0,
        'width': chartDimension,
        'height': chartDimension / 2,
        'fill': 'RGBA(0, 140, 112, 0.5)'
      })

  d3.select('#chart-container')
    .append('rect')
      .attr({
        'class': 'cover salary',
        'x': 0,
        'y': 0,
        'width': function(d){return xScale(16.9);},
        'height': chartDimension / 2,
        'fill': 'RGBA(0, 140, 112, 0.5)'
      })

  d3.select('#chart-container')
    .append('path').datum(irsData)
      .attr({
        'class': 'area outline',
        'd': area,
        'fill': 'white'
      })

  var flags = d3.select('#chart-container')
    .append('g')
      .attr({
        'class': 'flags',
        'stroke': '#bab8af',
        'stroke-width': 1
      })

  flags
    .append('g')
      .attr({
        'class': 'flags lines',
        'stroke': '#bab8af',
        'stroke-width': 1
      })
      .selectAll('.flag.line').data(irsData).enter()
      .append('line')
        .attr({
          'class': 'flag line',
          'x1': function(d){return xScale(d.originalIndex);},
          'x2': function(d){return xScale(d.originalIndex);},
          'y1': 0,
          'y2': function(d){return yScale(d.count) - 15;}
        })

  flags
    .append('g')
      .attr({
        'class': 'flags labels',
      })
      .selectAll('.flag.label').data(irsData).enter()
      .append('text')
        .text(function(d){return d.text;})
        .attr({
          'class': 'flag label',
          'dy': '0.9em',
          'transform': function(d){return 'translate('+ xScale(d.originalIndex) +',' + 0 + ')rotate(-90)';}
        })
}
