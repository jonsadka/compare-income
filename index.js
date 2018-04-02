const BROWN = 'RGBA(186, 184, 175, 1)';
const DARK_BROWN = 'RGBA(134, 129, 116, 1)'
const GREEN = 'RGBA(0, 140, 112, 1)';

const YEARS_WHITELIST = d3.range(2002, 2015);
const dataByYear = YEARS_WHITELIST.reduce((dataByYear, year) => ({
    ...dataByYear,
  [year]: {
    incomeThresholds: [],
    maxCount: 0,
    totalCount: 0,
    year
  }
}), {});

const DISPLAY_YEAR = 2013;

const chartContainer = document.getElementById('chart');
const topOffset = 70;
const margin = {top: 20 + 3, right: 75, bottom: 50 + 20 + 108, left: 64};
let width = chartContainer.offsetWidth;
let height = window.innerHeight - topOffset;

const svg = d3.select('#chart').append('svg')
  .attr('width', width).attr('height', height)
  .append('g')
    .attr('id','chart-container')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

const xScale = d3.scaleBand()
  .range([0, width - margin.right - margin.left])
  .paddingInner(0.07)
  .paddingOuter(0.07);
const yScale = d3.scaleLinear()
  .range([height - margin.bottom, margin.top]);
const voronoi = d3.voronoi()
  .x(d => xScale(d.year) + xScale.bandwidth() / 2)
  .y(d => yScale(d.cumulCount / dataByYear[d.year].totalCount))
  .extent([[0, 0], [width - margin.left, height - margin.bottom]]);
let voronoiDiagram = null;

d3.dsv(',', 'data.csv', formatCSVData).then((data) => {
  const years = Object.keys(dataByYear);
  xScale.domain(years);
  yScale.domain([0, 1]);

  initialRender();
});

window.onresize = updateWindow;

function formatCSVData(irsCsv, index){
  YEARS_WHITELIST.forEach(year => {
    const yearProgress = dataByYear[year];
    const prevCumulCount = yearProgress.totalCount;
    yearProgress.totalCount += Number(irsCsv[year]);
    yearProgress.maxCount = Math.max(yearProgress.maxCount, irsCsv[year]);

    const threshold =
      irsCsv.range.includes(' under ') ? irsCsv.range.split(' under ') :
      irsCsv.range.includes(' or ') ? irsCsv.range.split(' or ') :
      irsCsv.range;

    const lowerThreshold = Number(threshold[0].slice(1).split(',').join(''));
    const upperThreshold = Number(threshold[1].slice(1).split(',').join(''));
    yearProgress.incomeThresholds.push({
      count: Number(irsCsv[year]),
      cumulCount: yearProgress.totalCount,
      lowerThreshold: lowerThreshold,
      originalIndex: index,
      prevCumulCount,
      text: threshold[0].trim(),
      upperThreshold: Number.isNaN(upperThreshold) ? Infinity : upperThreshold,
      year
    });
  });
}

function initialRender(){
  const data = d3.nest()
    .key(d => d.year)
    .rollup(d => d[0].incomeThresholds)
    .entries(Object.values(dataByYear));

  const vData = data.reduce((vData, d) => vData.concat(d.value), []);
  const voronoiDiagram = voronoi(vData);
  console.log('~~dataByYear', dataByYear)

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale)
    .tickValues([0, 1])
    .tickFormat(d3.format(".0%"));

  svg.append('g')
    .call(xAxis)
    .attr('class','x axis')
    .attr('transform', `translate(0,${yScale(0)})`)
    .attr('font-size','14px');


  svg.append('g')
    .call(yAxis)
    .attr('class','y axis')

  const years = svg.selectAll('.year')
      .data(data)
    .enter().append('g')
      .attr('class', d => `year year-${d.key}`)
      .attr('transform', d => 'translate(' + xScale(d.key) + ',0)');

  const thresholds = years.selectAll('.threshold')
      .data(d => d.value)
    .enter().append('rect')
      .attr('class', d => `threshold threshold-${d.originalIndex}`)
      .attr('fill', 'none')
      .attr('stroke', DARK_BROWN)
      .attr('width', xScale.bandwidth())
      .attr('height', d =>
        yScale(d.prevCumulCount / dataByYear[d.year].totalCount) -
        yScale(d.cumulCount / dataByYear[d.year].totalCount))
      .attr('x', 0)
      .attr('y', d => yScale(d.cumulCount / dataByYear[d.year].totalCount))

  const textThresholdsRight = d3.selectAll(`.year.year-2014`)
    .selectAll('.threshold-text')
        .data(d => d.value)
      .enter().append('text')
        .text(d => d.text)
        .attr('class', d => `threshold-text threshold-text-${d.originalIndex}`)
        .attr('x', xScale.bandwidth() + 4)
        .attr('y', d => yScale(d.prevCumulCount / dataByYear[d.year].totalCount) + 4)
        .attr('fill', BROWN)

  const textThresholdPercentages = d3.selectAll(`.year`)
    .selectAll('.threshold-percentages')
        .data(d => d.value)
      .enter().append('text')
        .text(d => d3.format(".2%")(d.count / dataByYear[d.year].totalCount))
        .attr('class', d => `threshold-percentages threshold-percentages-${d.originalIndex}`)
        .attr('text-anchor', 'middle')
        .attr('opacity', 0)
        .attr('x', xScale.bandwidth() / 2)
        .attr('fill', DARK_BROWN)
        .attr('y', d =>
          yScale(d.prevCumulCount / dataByYear[d.year].totalCount) -
          (yScale(d.prevCumulCount / dataByYear[d.year].totalCount) -
          yScale(d.cumulCount / dataByYear[d.year].totalCount)) / 2 + 4)

  const voronoiChart = svg.append('g').selectAll('.voronoi')
    .data(voronoiDiagram.polygons())
    .enter().append('path')
    .attr('d', d => d ? 'M' + d.join('L') + 'Z' : null)
    .datum(d => d.point)
    .attr('class', 'voronoi')
    .attr('fill', 'none')
    .style('pointer-events', 'all')
    .on('mouseover', mouseMoveHandler)
    .on('mouseout',  mouseOutHandler);

  // callback for when the mouse moves across the overlay
  function mouseMoveHandler() {
    // get the current mouse position
    const [mx, my] = d3.mouse(this);

    // use the new diagram.find() function to find the Voronoi site
    // closest to the mouse, limited by max distance voronoiRadius
    const site = voronoiDiagram.find(mx, my);

    // highlight the point if we found one
    highlightThreshold(site && site.data);
  }

  function mouseOutHandler() {
    highlightThreshold(null);
  }
}

function highlightThreshold(site) {
  const thresholds = d3.selectAll('.threshold');
  const thresholdPercentages = d3.selectAll('.threshold-percentages');
  const thresholdText = d3.selectAll(`.threshold-text`)
  if (site) {
    d3.selectAll(`.threshold-${site.originalIndex}`).attr('fill', BROWN);
    d3.selectAll(`.threshold-percentages-${site.originalIndex}`).attr('opacity', 1);
    thresholdText.attr('opacity', d =>
      [site.originalIndex, site.originalIndex + 1].includes(d.originalIndex) ? 1 : 0.1)
  } else {
    thresholds.attr('fill', 'none');
    thresholdPercentages.attr('opacity', 0);
    thresholdText.attr('opacity', 1)
  }
}

const userSalaryInput = document.getElementById('usersalary');
userSalaryInput.oninput = onInputChange;

function onInputChange() {
  const userSalary = Number(userSalaryInput.value.replace(/[^\d\.]/g,'').trim());
  const salaryStats = calculateSalaryStats(userSalary);
  console.log(salaryStats)
//   var description = getDescription(salaryStats);
}

function calculateSalaryStats(userSalary){
  console.log(userSalary)
  const dataPerYear = Object.values(dataByYear);
  return dataPerYear.map(yearData => calculatePercentage(yearData, userSalary));
}

function calculatePercentage({incomeThresholds, totalCount}, userSalary) {
  for (let idx = 0; idx < incomeThresholds.length; idx++) {
    const threshold = incomeThresholds[idx];
    if (userSalary < threshold.upperThreshold) {
      const factor = (userSalary - threshold.lowerThreshold) / (threshold.upperThreshold - threshold.lowerThreshold);
      const calculatedIndex = idx + factor;
      const calculatedCumulCount = threshold.cumulCount - (1 - factor) * threshold.count
      const percentage = calculatedCumulCount / totalCount;
      return {
          description: getDescription(userSalary, percentage),
          index: calculatedIndex,
          percentage
        }
    };
  }
  return {};
}

function getDescription(userSalary, percentage){
  const format = d3.format('$,');
  let percent = Math.round(percentage * 10000) / 100;
  if (percent > 98){
    percent = Math.round((1 - percentage) * 10000) / 100;
  } else if (percent > 95){
    percent = Math.round((1 - percentage) * 1000) / 10;
  } else {
    percent = Math.round((1 - percentage) * 100);
  }

  return ['earned more','than ' + d3.format(".0%")(userSalary,2), percent + '%'];
}

function updateElements(){
//   var userSalary = +document.getElementById('usersalary').value.replace(/[^\d\.]/g,'').trim();
//   var salaryStats = calculateSalaryStats(userSalary);
//   var description = getDescription(salaryStats);
//   var salaryXPos = xScale(salaryStats.index);

//   d3.selectAll('.outline .circle').data(incomeThresholds)
//     .transition()
//     .attr({
//       'r': function(d){return xScale(d.originalIndex)/2;},
//       'cx': function(d){return xScale(d.originalIndex)/2 + margin.left;},
//       'cy': chartDimension/2,
//     })


//   d3.selectAll('.flag.line').data(incomeThresholds)
//     .transition()
//     .attr({
//       'x1': function(d){return xScale(d.originalIndex) + margin.left;},
//       'x2': function(d){return xScale(d.originalIndex) + margin.left;},
//       'y2': function(d){return Math.max(yScale(d.count) - 15, 0.8 * yScale(d.count));}
//     })

//   d3.selectAll('.flag.label').data(incomeThresholds)
//     .transition()
//     .attr({
//       'transform': function(d){return 'translate('+ (xScale(d.originalIndex) + margin.left) +',' + (0 + margin.top) + ')rotate(-90)';}
//     })

//   yAxis = d3.svg.axis()
//     .scale(yScale).orient('left')
//     .ticks(4).tickFormat(d3.format('s'))
//   d3.selectAll('.y.axis').transition().call(yAxis)
}

function updateWindow(){
  width = chartContainer.offsetWidth;
  height = window.innerHeight - topOffset;;

//   chartDimension = Math.min(width, height);
//   leftAdjust = Math.max(0, (width - chartDimension)/2);
//   topAdjust = 0;

//   d3.select('svg')
//     .attr({
//       'width': width,
//       'height': height
//     })

//   d3.select('#chart-container')
//     .attr('transform', 'translate(' + leftAdjust + ',' + topAdjust + ')');

//   // UPDATE THE D3 EQUATIONS
//   xScale.range([0, chartDimension - margin.right - margin.left]);
//   yScale.range([chartDimension / 2, margin.top]);

  updateElements();
}
