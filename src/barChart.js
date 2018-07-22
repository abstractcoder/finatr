import React, { Component } from 'react';
import * as d3 from 'd3';
import getDay from 'date-fns/fp/getDay';
import getDate from 'date-fns/fp/getDate';

export class BarChart extends Component {
  componentDidMount() {
    let { data } = this.props;

    let svg = barBuild.init();

    let acc = {
      income: [],
      expense: [],
      transfer: []
    };
    data.forEach(d => {
      switch (d.type) {
        case 'income':
          acc.income.push(d);
          break;
        case 'expense':
          acc.expense.push(d);
          break;
        case 'transfer':
          acc.transer.push(d);
          break;
        default:
          break;
      }
    });

    let dataMassagedIncome = barBuild.graph(acc.income);
    let dataMassagedExpense = barBuild.graph(acc.expense);
    // let dataMassagedTransfer = barBuild.graph(acc.transfer);
    let dataMassaged = barBuild.graph(data);
    let accountData = barBuild.accountGraph(data, dataMassaged);
    let max_domain_bars = d3.max([
      dataMassagedIncome[0].maxHeight,
      dataMassagedExpense[0].maxHeight
      // dataMassagedTransfer[0].maxHeight
    ]);

    let barExpense = barBuild.drawBar(
      svg,
      'neg',
      dataMassagedExpense,
      max_domain_bars
    );
    let barIncome = barBuild.drawBar(
      svg,
      'pos',
      dataMassagedIncome,
      max_domain_bars
    );
    // let barTransfer = barBuild.drawBar(svg, 'transfer', dataMassagedTransfer);
    let axis = barBuild.drawAxis(svg, max_domain_bars);

    let svg2 = barBuild.init();
    let max_domain_line = d3.max(accountData, d =>
      d3.max(d.values, d => d3.max(d.data))
    );

    let line = barBuild.drawLine(svg2, accountData, max_domain_line);
    let axis2 = barBuild.drawAxis(svg2, max_domain_line);
  }

  render() {
    return (
      <div>
        <div className="bar-section" style={{ overflow: 'auto' }} />
      </div>
    );
  }
}

export default BarChart;

let barBuild = {
  rdata: function() {
    return [0];
  },
  fill: function() {
    return null;
  },
  selector: function() {
    return '.bar-section';
  },
  div_width: function() {
    return 600;
  },
  daysinfuture: function() {
    if (this.div_width() > 1000) {
      return 240;
    } else {
      return 120;
    }
  },
  margin: function() {
    return { top: 10, right: 20, bottom: 40, left: 40 };
  },
  width: function() {
    let w =
      this.div_width() -
      this.margin().left -
      this.margin().right +
      this.daysinfuture() * 20;
    return w;
  },
  height: function() {
    return d3.min([
      this.div_width() * 0.5 - this.margin().top - this.margin().bottom,
      350
    ]);
  },
  colors: function(set) {
    if (set === 'pos') {
      return ['#a1d99b', '#41ab5d'];
    } else if (set === 'neg') {
      return ['#fb6a4a', '#cb181d'];
    } else if (set === 'trans') {
      return ['#FAA43A'];
    } else {
      return ['#000000'];
    }
  },
  shift: function() {
    return (1.1 * this.width()) / this.daysinfuture();
  },
  today: function() {
    return new Date();
  },
  future: function() {
    let future = new Date();
    future.setDate(future.getDate() + this.daysinfuture());
    return future;
  },
  past: function() {
    let past = new Date();
    past.setDate(past.getDate() - 1);
    return past;
  },
  one_day: function() {
    return 1000 * 60 * 60 * 24;
  },
  graphrange: function() {
    return [convertdate(this.past()), convertdate(this.future())];
  },
  min_x: function() {
    return parseDate(this.graphrange()[0]);
  },
  max_x: function() {
    return parseDate(this.graphrange()[1]);
  },
  maxfinder: function(data) {
    data = this.stack(data);

    let rmax = 0;
    for (let i = 0; data.length > i; i++) {
      rmax = Math.max(
        rmax,
        d3.max(data[i].graph(), function(d) {
          return d.y + d.y0;
        })
      );
    }
    return rmax;
  },
  maxbalance: function(data) {
    let bmax = 0;
    for (let i = 0; data.length > i; i++) {
      bmax = Math.max(
        bmax,
        d3.max(data[i].graph(), function(d) {
          return d.y;
        })
      );
    }
    return bmax;
  },
  xScale: function() {
    return d3
      .scaleTime()
      .domain([this.past(), this.future()])
      .rangeRound([0, this.width() - this.margin().left]);
  },
  yScale: function(max_domain) {
    return d3
      .scaleLinear()
      .domain([0, max_domain])
      .range([this.height() - this.margin().top, 0]);
  },
  graph: function(data) {
    let arrData = [];
    let keys = [];

    data.forEach(d => {
      let key = `${d.id}`;
      keys.push(key);
    });

    for (let i = this.min_x(); i <= this.max_x(); i.setDate(i.getDate() + 1)) {
      //create object for stack layout
      let obj = {};
      obj.date = new Date(i);
      data.forEach(d => {
        let key = `${d.id}`;
        obj[key] = { ...d };

        if (convertdate(i) === d.start && this.rtype() === 'none') {
          obj[key].y = d.value;
        } else if (convertdate(i) > d.end && d.end !== 'none') {
          obj[key].y = 0;
        } else if (
          d.rtype === 'day' &&
          d.cycle != null &&
          ((i - parseDate(d.start)) / (24 * 60 * 60 * 1000)) % d.cycle < 1
        ) {
          obj[key].y = d.value;
        } else if (
          d.rtype === 'day of week' &&
          convertdate(i) >= d.start &&
          getDay(i) === d.repeat
        ) {
          obj[key].y = d.value;
        } else if (
          d.rtype === 'day of month' &&
          convertdate(i) >= d.start &&
          getDate(i) === d.repeat
        ) {
          obj[key].y = d.value;
        } else {
          obj[key].y = 0;
        }
      });
      arrData.push(obj);
    }

    let stack = d3
      .stack()
      .value((d, key) => d[key].y)
      .keys(keys);

    let stacked = stack(arrData);

    let maxHeight = d3.max(stacked.reduce((a, b) => a.concat(b)), d => d[1]);

    return data.map((entry, index) => ({
      ...entry,
      stack: stacked[index],
      maxHeight: maxHeight
    }));
  },
  accountGraph: function(data, dataMassaged) {
    let accounts = data
      .map(d => d.raccount)
      .filter((d, i, a) => a.indexOf(d) === i);

    return accounts.map(account => {
      let acc = {
        income: [],
        expense: [],
        transfer: []
      };
      dataMassaged.forEach(d => {
        if (d.raccount === account) {
          switch (d.type) {
            case 'income':
              acc.income.push(d.stack);
              break;
            case 'expense':
              acc.expense.push(d.stack);
              break;
            case 'transfer':
              acc.transer.push(d.stack);
              break;
            default:
              break;
          }
        }
      });

      let accountStack = {};
      const zipTogethor = array =>
        array.reduce((accumlator, d) => {
          let flatten = d.map(e => e[1] - e[0]);
          return accumlator.length === 0
            ? flatten
            : accumlator.map((d, i, thisArray) => d + flatten[i]);
        }, []);
      const extractValue = value => {
        if (value === undefined) {
          return 0;
        } else {
          return value;
        }
      };

      accountStack.income = zipTogethor(acc.income);
      accountStack.expense = zipTogethor(acc.expense);
      accountStack.transfer = zipTogethor(acc.transfer);
      let arrayLength = Math.max(
        accountStack.income.length,
        accountStack.expense.length,
        accountStack.transfer.length
      );
      let finalZippedLine = { account: account, values: [] };
      for (let iterator = 0; iterator < arrayLength; iterator++) {
        let prevVal =
          finalZippedLine.values.length === 0
            ? 0
            : extractValue(finalZippedLine.values[iterator - 1].data[1]);
        let firstStep = prevVal - extractValue(accountStack.expense[iterator]);
        let secondStep =
          firstStep +
          extractValue(accountStack.income[iterator]) +
          extractValue(accountStack.transfer[iterator]);
        finalZippedLine.values.push({
          date: dataMassaged[0].stack[iterator].data.date,
          data: [firstStep, secondStep]
        });
      }
      return finalZippedLine;
    });
  }
};

barBuild.init = function(height) {
  // make svg div with specified size and axis
  return d3
    .select(this.selector())
    .append('svg')
    .attr('width', this.width() + this.margin().left + this.margin().right)
    .attr(
      'height',
      d3.sum([this.height(), this.margin().top, this.margin().bottom])
    )
    .append('g')
    .attr('transform', `translate(${this.margin().left},${this.margin().top})`);
};

barBuild.drawAxis = function(svg, max_domain) {
  // create axis
  let xAxis = d3
    .axisBottom(this.xScale())
    .ticks(d3.timeDay.every(1))
    .tickFormat(d3.timeFormat('%b %d'));

  let yAxis = d3.axisLeft(this.yScale(max_domain)).ticks(10);

  let drawnX = svg
    .append('g')
    .attr('class', 'xaxis')
    .attr('transform', `translate(${this.shift() / 2},${this.height()})`)
    .call(xAxis);

  drawnX
    .selectAll('text')
    .style('text-anchor', 'end')
    .attr('dx', '-.8em')
    .attr('dy', '-.55em')
    .attr('transform', 'rotate(-90)');

  drawnX
    .select('path')
    .attr('transform', `translate(-${this.shift() / 2},${0})`);

  let drawnY = svg
    .append('g')
    .attr('class', 'yaxis')
    .attr('transform', `translate(${0},${this.margin().top})`)
    .call(yAxis);

  drawnY
    .append('text')
    .attr('transform', `rotate(-90)`)
    .attr('y', 6)
    .attr('dy', '.71em')
    .style('text-anchor', 'end')
    .text('Value ($)');

  return;
};

barBuild.drawBar = function(svg, append_class, massagedData, max_domain) {
  let blobs = svg
    .append('g')
    .attr('class', 'blobs')
    .attr('transform', `translate(${this.shift() / 2},${this.margin().top})`);

  let tweak = () => {
    if (append_class === 'pos') {
      return 0.9;
    } else {
      return 0.7;
    }
  };

  let colors = function(set) {
    if (set === 'pos') {
      return ['#a1d99b', '#41ab5d'];
    } else if (set === 'neg') {
      return ['#fb6a4a', '#cb181d'];
    } else if (set === 'trans') {
      return ['#FAA43A'];
    } else {
      return ['#000000'];
    }
  };

  let color = d3
    .scaleLinear()
    .domain([0, 1])
    .range(colors(append_class));

  // Add a group for each entry
  let groups = blobs
    .selectAll('g')
    .filter(append_class)
    .data(massagedData)
    .enter()
    .insert('g')
    .attr('class', append_class)
    .attr('id', (d, i) => `${i} ${d.category}`)
    .style('fill', (d, i) => color(i));

  // Add a rect for each data value
  let rects = groups
    .selectAll(`g.${append_class} rect.${append_class}`)
    .data((d, i) => d.stack);

  rects
    .enter()
    .append('rect')
    .transition()
    .duration(1500)
    .attr('class', append_class)
    .attr('x', (d, i) => barBuild.xScale()(d.data.date))
    .attr('y', (d, i) => barBuild.yScale(max_domain)(d[1]))
    .attr('height', (d, i) => {
      return (
        barBuild.yScale(max_domain)(d[0]) - barBuild.yScale(max_domain)(d[1])
      );
    })
    .attr('width', this.shift() * 0.9 * tweak())
    .attr('transform', `translate(${this.shift() / 2},${0})`);

  groups.exit().remove();
  rects.exit().remove();

  return svg;
};

barBuild.drawLine = function(svg, data, max_domain) {
  let linecolors = d3.scaleOrdinal(d3.schemeCategory10);

  const line = d3
    .line()
    .x(d => barBuild.xScale()(d.date))
    .y(d => barBuild.yScale(max_domain)(d.data[1]));

  let lines = svg
    .append('g')
    .attr('class', 'line')
    .attr('transform', `translate(${this.shift() / 2},${this.margin().top})`)
    .selectAll('path')
    .data(data);

  lines
    .transition()
    .duration(1500)
    .attr('d', d => line(d.values))
    .attr('stroke', (d, i) => linecolors(i))
    .attr('stroke-width', 2)
    .attr('fill', 'none')
    .attr('transform', `translate(${this.shift()},${this.margin().top})`);

  lines
    .enter()
    .append('path')
    .attr('d', d => line(d.values))
    .attr('stroke', (d, i) => linecolors(i))
    .attr('stroke-width', 2)
    .attr('fill', 'none')
    .attr('transform', `translate(${this.shift()},${this.margin().top})`);

  lines.exit().remove();
};

// function to convert javascript dates into a pretty format (i.e. '2014-12-03')
const convertdate = date => {
  let dd = date.getDate();
  let mm = date.getMonth() + 1; //January is 0!
  let yyyy = date.getFullYear();

  if (dd < 10) {
    dd = '0' + dd;
  }
  if (mm < 10) {
    mm = '0' + mm;
  }

  return yyyy + '-' + mm + '-' + dd;
};

const parseDate = date => {
  return d3.timeParse('%Y-%m-%d')(date);
};
