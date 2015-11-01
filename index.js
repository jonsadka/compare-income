var maxCount = 0;
var totalCount = 0;
var incomeThresholds = [];
var DEFAULT_SALARY = 300000;
var typPadding = 4;

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
  console.log(irsData)
  incomeThresholds = irsData;

  updateD3Functions(irsData);
  initialRender(irsData)
}

function updateD3Functions(irsData){
  xScale.domain([0, irsData.length - 1]);
  yScale.domain([0, maxCount * 1.2]);
}

function initialRender(irsData){
  var salaryStats = calculateSalaryStats(DEFAULT_SALARY);
  var description = getDescription(salaryStats);
  var salaryXPos = xScale(salaryStats.index);

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
        'r': salaryXPos/2,
        'cx': salaryXPos/2 + margin.left,
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
        'width': salaryXPos,
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

  var descriptions = d3.select('#chart-container')
    .append('g')
      .attr({
        'class': 'descriptions',
      })

  var percentageTextSize = 36;
  var textTextSize = 14;
  descriptions
    .append('text')
      .text(description[2])
      .attr({
        'class': 'description percentage',
        'text-anchor': 'end',
        'alignment-baseline': 'after-edge',
        'transform': 'translate(' + (salaryXPos + margin.right - typPadding) + ',' + (chartDimension / 2 + percentageTextSize + typPadding) + ')',
        'font-size': percentageTextSize,
        'fill': 'white'
      })

  descriptions.selectAll('.description.text').data(description.slice(0,2)).enter()
    .append('text')
      .text(function(d){return d;})
      .attr({
        'class': 'description text',
        'font-size': textTextSize,
        'alignment-baseline': 'after-edge',
        'transform': function(d, i){
          return 'translate(' + (salaryXPos + margin.right + typPadding) + ',' + (chartDimension / 2 + (i + 1) * (textTextSize) + typPadding) + ')'
        },
        'fill': '#868174'
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
          'text-anchor': 'end',
          'transform': function(d){return 'translate('+ (xScale(d.originalIndex) + margin.left) +',' + (0 + margin.top) + ')rotate(-90)';}
        })
}

function calculateSalaryStats(userSalary){
  for (var i = 0; i < incomeThresholds.length; i++){
    var threshold = incomeThresholds[i];
    if (userSalary < threshold.upperThreshold) {
      var factor = (userSalary - threshold.lowerThreshold)/(threshold.upperThreshold - threshold.lowerThreshold);
      var calculatedIndex = i + factor;
      var calculatedCumulCount = threshold.cumulCount - factor * threshold.count

      return {
          userSalary: userSalary,
          index: calculatedIndex,
          percentage: calculatedCumulCount / totalCount
        }
    };
  }
  return {};
}

function getDescription(salaryStats){
  var format = d3.format('$,');
  var percent = Math.round(salaryStats.percentage * 10000)/100;
  if (percent > 98){
    percent = Math.round(salaryStats.percentage * 10000)/100;
  } else if (percent > 95){
    percent = Math.round(salaryStats.percentage * 1000)/10;
  } else {
    percent = Math.round(salaryStats.percentage * 100);
  }
  return ['of Americans earned','less than ' + format(d3.round(salaryStats.userSalary,2)), percent + '%'];
}
