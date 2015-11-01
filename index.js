var maxCount = 0;
var totalCount = 0;
var incomeThresholds = [];
var DEFAULT_SALARY = 300000;

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
var margin = {top: 20, right: 20, bottom: 20, left: 20};
var xScale = d3.scale.linear().range([0, chartDimension - margin.right - margin.left]);
var yScale = d3.scale.linear().range([chartDimension / 2, 0]);

var area = d3.svg.area().interpolate('cardinal')
  .x(function(d){return xScale(d.originalIndex) + margin.left;})
  .y0(0 + margin.top)
  .y1(function(d){return yScale(d.count);})

d3.csv('data.csv', formatCSVData, processData);

function formatCSVData(irsCsv, index){
  totalCount += +irsCsv.count;
  maxCount = Math.max(maxCount, irsCsv.count);

  var threshold = irsCsv.range.split(' to ') || irsCsv.range;
  var lowerThreshold = +threshold[0].slice(1).split(',').join('');
  var upperThreshold = +threshold[1].slice(1).split(',').join('');
  return {
    text: irsCsv.range.split(' to ')[0],
    lowerThreshold: lowerThreshold,
    upperThreshold: upperThreshold || Infinity,
    count: +irsCsv.count,
    cumulCount: totalCount,
    originalIndex: index
  }
}

function processData(err, irsData){
  incomeThresholds = irsData;
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
          'cx': function(d){return xScale(d.originalIndex)/2 + margin.left;},
          'cy': chartDimension/2,
          'opacity': 0.20
        })

  d3.select('#chart-container')
    .append('circle')
      .attr({
        'class': 'salary circle',
        'fill': 'RGBA(0, 140, 112, ' + (0.5 + 0.5 * 0.3) + ')',
        'r': function(d){return xScale( calculateSalaryStats(DEFAULT_SALARY).index )/2;},
        'cx': function(d){return xScale( calculateSalaryStats(DEFAULT_SALARY).index )/2 + margin.left;},
        'cy': chartDimension/2
      })

  d3.select('#chart-container')
    .append('rect')
      .attr({
        'class': 'cover white',
        'x': 0 + margin.left,
        'y': 0 + margin.top,
        'width': chartDimension - margin.left - margin.right,
        'height': chartDimension / 2 - margin.top,
        'fill': 'white',
      })

  d3.select('#chart-container')
    .append('rect')
      .attr({
        'class': 'cover green',
        'x': 0 + margin.left,
        'y': 0 + margin.top,
        'width': chartDimension - margin.left - margin.right,
        'height': chartDimension / 2 - margin.top,
        'fill': 'RGBA(0, 140, 112, 0.5)'
      })

  d3.select('#chart-container')
    .append('rect')
      .attr({
        'class': 'cover salary',
        'x': 0 + margin.left,
        'y': 0 + margin.top,
        'width': function(d){return xScale( calculateSalaryStats(DEFAULT_SALARY).index );},
        'height': chartDimension / 2 - margin.top,
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
          'x1': function(d){return xScale(d.originalIndex) + margin.left;},
          'x2': function(d){return xScale(d.originalIndex) + margin.left;},
          'y1': 0 + margin.top,
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
          'transform': function(d){return 'translate('+ (xScale(d.originalIndex) + margin.left) +',' + (0 + margin.top) + ')rotate(-90)';}
        })
}


function calculateSalaryStats(userSalary){
  // var result = {index: 123, percentage: .53};
  for (var i = 0; i < incomeThresholds.length; i++){
    var threshold = incomeThresholds[i];
    if (userSalary < threshold.upperThreshold) {
      var factor = (userSalary - threshold.lowerThreshold)/(threshold.upperThreshold - threshold.lowerThreshold);
      var calculatedIndex = i + factor;
      var calculatedCumulCount = threshold.cumulCount - factor * threshold.count

      console.log(calculatedCumulCount / totalCount)
      return {index: calculatedIndex, percentage: calculatedCumulCount / totalCount}
    //   var citizenChange = factor*(threshold.citizens - threshold.citizens);
    //   result.push({
    //     income: userSalary,
    //     citizens: threshold.citizens + citizenChange,
    //     index: threshold.index + factor,
    //     cumulCitizens: threshold.cumulCitizens + Math.abs(citizenChange)
    //   });
    };
  }
  return {};
}
