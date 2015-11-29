var BROWN = 'RGBA(186, 184, 175,';
var DARK_BROWN = 'RGBA(134, 129, 116,'
var GREEN = 'RGBA(0, 140, 112,';
var ORANGE = 'RGBA(255, 109, 24,';
var WHITE = 'RGBA(255, 255, 255,';

var maxCount = 0;
var totalCount = 0;
var incomeThresholds = [];
var typPadding = 2;
var topMargin = 70;

// ADD PAGE ELEMENTS
var chartContainer = document.getElementById('chart');
var width = chartContainer.offsetWidth;
var height = window.innerHeight - topMargin;

var chartDimension = Math.min(width, height);
var leftAdjust = Math.max(0, (width - chartDimension)/2);
var topAdjust = 0;

var svg = d3.select('#chart').append('svg')
  .attr('width', width).attr('height', height)
  .style('background-color', WHITE + '1)')
  .append('g')
    .attr('id','chart-container')
    .attr('transform', 'translate(' + leftAdjust + ',' + topAdjust + ')');

// SETUP THE D3 EQUATIONS
var margin = {top: 50, right: 50, bottom: 50, left: 50};
var xScale = d3.scale.linear().range([0, chartDimension - margin.right - margin.left]);
var yScale = d3.scale.linear().range([chartDimension / 2, margin.top]);

var area = d3.svg.area().interpolate('cardinal')
  .x(function(d){return xScale(d.originalIndex) + margin.left;})
  .y0(0 + margin.top)
  .y1(function(d){return yScale(d.count);})

d3.csv('data.csv', formatCSVData, processData);

window.onresize = updateWindow;

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

  xScale.domain([0, irsData.length - 1]);
  yScale.domain([0, maxCount * 1.2]);

  initialRender()
}

function initialRender(){
  var userSalary = +document.getElementById('usersalary').value.replace(/[^\d\.]/g,'').trim();
  var salaryStats = calculateSalaryStats(userSalary);
  var description = getDescription(salaryStats);
  var salaryXPos = xScale(salaryStats.index);

  d3.select('#chart-container')
    .append('g')
      .attr({
        'class': 'outline circles',
        'fill': 'none',
        'stroke': BROWN + '1)',
        'stroke-width': 1
      })
      .selectAll('.outline .circle').data(incomeThresholds).enter()
      .append('circle')
        .attr({
          'class': 'outline circle',
          'r': function(d){return xScale(d.originalIndex)/2;},
          'cx': function(d){return xScale(d.originalIndex)/2 + margin.left;},
          'cy': chartDimension/2,
          'opacity': 0.25
        })

  d3.select('#chart-container')
    .append('circle')
      .attr({
        'class': 'salary circle',
        'fill': GREEN + (0.5 + 0.5 * 0.3) + ')',
        'r': salaryXPos/2,
        'cx': salaryXPos/2 + margin.left,
        'cy': chartDimension/2
      })

  d3.select('#chart-container')
    .append('circle')
      .attr({
        'class': 'missing salary circle',
        'fill': GREEN + '0.2)',
        'r': (chartDimension - margin.right - margin.left - salaryXPos)/2,
        'cx': margin.left + salaryXPos + (chartDimension - margin.right - margin.left - salaryXPos)/2,
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
        'fill': WHITE + '1)',
      })

  d3.select('#chart-container')
    .append('rect')
      .attr({
        'class': 'cover green',
        'x': 0 + margin.left,
        'y': 0 + margin.top,
        'width': chartDimension - margin.left - margin.right,
        'height': chartDimension / 2 - margin.top,
        'fill': GREEN + '0.2)'
      })

  d3.select('#chart-container')
    .append('rect')
      .attr({
        'class': 'cover salary',
        'x': 0 + margin.left,
        'y': 0 + margin.top,
        'width': salaryXPos,
        'height': chartDimension / 2 - margin.top,
        'fill': GREEN + '0.5)'
      })

  d3.select('#chart-container')
    .append('path').datum(incomeThresholds)
      .attr({
        'class': 'area outline',
        'd': area,
        'fill': WHITE + '1)'
      })

  var descriptions = d3.select('#chart-container')
    .append('g')
      .attr({
        'class': 'descriptions',
      })

  var percentageTextSize = calculateFontSize();
  descriptions
    .append('text')
      .text(description[2])
      .attr({
        'class': 'description percentage',
        'text-anchor': 'end',
        'alignment-baseline': 'after-edge',
        'transform': 'translate(' + (chartDimension - margin.left) + ',' + (chartDimension / 2 + typPadding) + ')',
        'font-size': percentageTextSize,
        'fill': ORANGE + '1)'
      })

  var textTextSize = 14;
  descriptions.selectAll('.description.text').data(description.slice(0,2)).enter()
    .append('text')
      .text(function(d){return d;})
      .attr({
        'class': 'description text',
        'font-size': textTextSize,
        'text-anchor': 'end',
        'alignment-baseline': 'after-edge',
        'transform': function(d, i){
          return 'translate(' + (chartDimension - margin.left) + ',' + (chartDimension / 2 + (i + 1) * (textTextSize) + typPadding) + ')'
        },
        'fill': ORANGE + '1)'
      })

  var flags = d3.select('#chart-container')
    .append('g')
      .attr({
        'class': 'flags',
        'stroke': BROWN + '0.25)',
        'fill': BROWN + '0.75)',
        'stroke-width': 1
      })

  flags
    .append('g')
      .attr({
        'class': 'flags lines',
        'stroke-width': 1
      })
      .selectAll('.flag.line').data(incomeThresholds).enter()
      .append('line')
        .attr({
          'class': 'flag line',
          'x1': function(d){return xScale(d.originalIndex) + margin.left;},
          'x2': function(d){return xScale(d.originalIndex) + margin.left;},
          'y1': 0 + margin.top,
          'y2': function(d){return Math.max(yScale(d.count) - 15, 0.8 * yScale(d.count));}
        })

  flags
    .append('g')
      .attr({
        'class': 'flags labels',
        'stroke': 'none',
        'font-size': 14
      })
      .selectAll('.flag.label').data(incomeThresholds).enter()
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
      var calculatedCumulCount = threshold.cumulCount - (1 - factor) * threshold.count

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
    percent = Math.round((1 - salaryStats.percentage) * 10000)/100;
  } else if (percent > 95){
    percent = Math.round((1 - salaryStats.percentage) * 1000)/10;
  } else {
    percent = Math.round((1 - salaryStats.percentage) * 100);
  }
  return ['earned more','than ' + format(d3.round(salaryStats.userSalary,2)), percent + '%'];
}

function calculateFontSize(){
  var chartDimensionMultiplier = chartDimension / 1000;
  var calculatedSize = 48 * chartDimensionMultiplier;
  return Math.min(calculatedSize, 48);
}

function updateSalary(){
  var userSalary = +document.getElementById('usersalary').value.replace(/[^\d\.]/g,'').trim();
  var salaryStats = calculateSalaryStats(userSalary);
  var description = getDescription(salaryStats);
  var salaryXPos = xScale(salaryStats.index);

  d3.selectAll('.salary.circle')
    .transition().duration(1000)
    .attr({
      'r': salaryXPos/2,
      'cx': salaryXPos/2 + margin.left
    })

  d3.selectAll('.missing.salary.circle')
    .transition().duration(1000)
    .attr({
      'r': (chartDimension - margin.right - margin.left - salaryXPos)/2,
      'cx': margin.left + salaryXPos + (chartDimension - margin.right - margin.left - salaryXPos)/2
    })

  d3.selectAll('.cover.salary')
    .transition().duration(1000)
    .attr({
      'width': salaryXPos
    })

  d3.selectAll('.description.percentage')
    .text(description[2])
    .transition().duration(1000)
    .attr({
      'transform': 'translate(' + (chartDimension - margin.left) + ',' + (chartDimension / 2 + typPadding) + ')'
    })

  var textTextSize = 14;
  d3.selectAll('.description.text').data(description.slice(0,2))
    .text(function(d){return d;})
    .transition().duration(1000)
    .attr({
      'font-size': textTextSize,
      'transform': function(d, i){
        return 'translate(' + (chartDimension - margin.left) + ',' + (chartDimension / 2 + (i + 1) * (textTextSize) + typPadding) + ')'
      }
    })
}

function updateElements(){
  var userSalary = +document.getElementById('usersalary').value.replace(/[^\d\.]/g,'').trim();
  var salaryStats = calculateSalaryStats(userSalary);
  var description = getDescription(salaryStats);
  var salaryXPos = xScale(salaryStats.index);

  d3.selectAll('.outline .circle').data(incomeThresholds)
    .transition()
    .attr({
      'r': function(d){return xScale(d.originalIndex)/2;},
      'cx': function(d){return xScale(d.originalIndex)/2 + margin.left;},
      'cy': chartDimension/2,
    })

  d3.selectAll('.salary.circle')
    .transition()
    .attr({
      'r': salaryXPos/2,
      'cx': salaryXPos/2 + margin.left,
      'cy': chartDimension/2
    })

  d3.selectAll('.missing.salary.circle')
    .transition()
    .attr({
      'r': (chartDimension - margin.right - margin.left - salaryXPos)/2,
      'cx': margin.left + salaryXPos + (chartDimension - margin.right - margin.left - salaryXPos)/2,
      'cy': chartDimension/2
    })

  d3.selectAll('.cover.white')
    .transition()
    .attr({
      'width': chartDimension - margin.left - margin.right,
      'height': chartDimension / 2 - margin.top
    })

  d3.selectAll('.cover.green')
    .transition()
    .attr({
      'width': chartDimension - margin.left - margin.right,
      'height': chartDimension / 2 - margin.top
    })

  d3.selectAll('.cover.salary')
    .transition()
    .attr({
      'width': salaryXPos,
      'height': chartDimension / 2 - margin.top
    })

  d3.selectAll('.area.outline').datum(incomeThresholds)
    .transition()
    .attr({
      'd': area
    })

  var percentageTextSize = calculateFontSize();
  d3.selectAll('.description.percentage')
    .transition()
    .attr({
      'transform': 'translate(' + (chartDimension - margin.left) + ',' + (chartDimension / 2 + typPadding) + ')',
      'font-size': percentageTextSize
    })

  var textTextSize = 14;
  d3.selectAll('.description.text').data(description.slice(0,2))
    .transition()
    .attr({
      'font-size': textTextSize,
      'transform': function(d, i){
        return 'translate(' + (chartDimension - margin.left) + ',' + (chartDimension / 2 + (i + 1) * (textTextSize) + typPadding) + ')'
      }
    })

  d3.selectAll('.flag.line').data(incomeThresholds)
    .transition()
    .attr({
      'x1': function(d){return xScale(d.originalIndex) + margin.left;},
      'x2': function(d){return xScale(d.originalIndex) + margin.left;},
      'y2': function(d){return Math.max(yScale(d.count) - 15, 0.8 * yScale(d.count));}
    })

  d3.selectAll('.flag.label').data(incomeThresholds)
    .transition()
    .attr({
      'transform': function(d){return 'translate('+ (xScale(d.originalIndex) + margin.left) +',' + (0 + margin.top) + ')rotate(-90)';}
    })
}

function updateWindow(){
  width = chartContainer.offsetWidth;
  height = window.innerHeight - topMargin;

  chartDimension = Math.min(width, height);
  leftAdjust = Math.max(0, (width - chartDimension)/2);
  topAdjust = 0;

  d3.select('svg')
    .attr({
      'width': width,
      'height': height
    })

  d3.select('#chart-container')
    .attr('transform', 'translate(' + leftAdjust + ',' + topAdjust + ')');

  // UPDATE THE D3 EQUATIONS
  xScale.range([0, chartDimension - margin.right - margin.left]);
  yScale.range([chartDimension / 2, margin.top]);

  updateElements();
}
