var maxCount = 0;
var totalCount = 0;
var incomeThresholds = [];
var typPadding = 2;

// ADD PAGE ELEMENTS
var upperContainer = document.getElementById('upper-content');
var chartContainer = document.getElementById('chart');
var width = chartContainer.offsetWidth;
var height = window.innerHeight - upperContainer.offsetHeight;

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

  initialRender(irsData)
}

function initialRender(irsData){
  var userSalary = +document.getElementById('usersalary').value.replace(/[^\d\.]/g,'').trim() || 100000;
  var salaryStats = calculateSalaryStats(userSalary);
  var description = getDescription(salaryStats);
  var salaryXPos = xScale(salaryStats.index);

  d3.select('#chart-container')
    .append('g')
      .attr({
        'class': 'outline circles',
        'fill': 'none',
        'stroke': 'RGBA(186, 184, 175, 1)',
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

  var percentageTextSize = calculateFontSize(userSalary);
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

  var textTextSize = 14;
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
        'stroke': 'RGBA(186, 184, 175, 1)',
        'stroke-width': 1
      })

  flags
    .append('g')
      .attr({
        'class': 'flags lines',
        'stroke': 'RGBA(186, 184, 175, 1)',
        'stroke-width': 1
      })
      .selectAll('.flag.line').data(irsData).enter()
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
        'fill': 'RGBA(186, 184, 175, 0.45)',
        'font-size': 12
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

function calculateFontSize(userSalary){
  var chartDimensionMultiplier = chartDimension / 400;
  var calculatedSize = Math.max(6, userSalary/13000 * 36 * chartDimensionMultiplier);
  return Math.min(calculatedSize, 36)
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

  d3.selectAll('.cover.salary')
    .transition().duration(1000)
    .attr({
      'width': salaryXPos
    })

  var percentageTextSize = calculateFontSize(userSalary);
  d3.selectAll('.description.percentage')
    .text(description[2])
    .transition().duration(1000)
    .attr({
      'transform': 'translate(' + (salaryXPos + margin.right - typPadding) + ',' + (chartDimension / 2 + percentageTextSize + typPadding) + ')',
      'font-size': percentageTextSize
    })

  var textTextSize = 14;
  d3.selectAll('.description.text').data(description.slice(0,2))
    .text(function(d){return d;})
    .transition().duration(1000)
    .attr({
      'font-size': textTextSize,
      'transform': function(d, i){
        return 'translate(' + (salaryXPos + margin.right + typPadding) + ',' + (chartDimension / 2 + (i + 1) * (textTextSize) + typPadding) + ')'
      }
    })
}

function updateElements(){
  var userSalary = +document.getElementById('usersalary').value.replace(/[^\d\.]/g,'').trim() || 100000;
  var salaryStats = calculateSalaryStats(userSalary);
  var description = getDescription(salaryStats);
  var salaryXPos = xScale(salaryStats.index);
  console.log(xScale(1))

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
    .attr({
      'width': salaryXPos,
      'height': chartDimension / 2 - margin.top
    })

  d3.selectAll('.area.outline').datum(incomeThresholds)
    .transition()
    .attr({
      'd': area
    })

  var percentageTextSize = calculateFontSize(userSalary);
  d3.selectAll('.description.percentage')
    .transition()
    .attr({
      'transform': 'translate(' + (salaryXPos + margin.right - typPadding) + ',' + (chartDimension / 2 + percentageTextSize + typPadding) + ')',
      'font-size': percentageTextSize
    })

  var textTextSize = 14;
  d3.selectAll('.description.text').data(description.slice(0,2))
    .transition()
    .attr({
      'font-size': textTextSize,
      'transform': function(d, i){
        return 'translate(' + (salaryXPos + margin.right + typPadding) + ',' + (chartDimension / 2 + (i + 1) * (textTextSize) + typPadding) + ')'
      }
    })

  d3.selectAll('.flag.line').data(incomeThresholds)
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
  height = window.innerHeight - upperContainer.offsetHeight;

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
  yScale.range([chartDimension / 2, 0]);

  updateElements();
  // updateSalary();
}
