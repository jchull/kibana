/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */


/* eslint-disable no-unused-vars */

import d3                               from 'd3';
import _                                from 'lodash';
import { VislibLibChartLegendProvider } from './chart_legend';

describe('Vislib Chart Legend Class Test Suite', () => {

  jest.mock('./handler');


  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  const Private = function (provider) {
    return provider((p) => p);
  };

  const ChartLegend = Private(VislibLibChartLegendProvider);

  const legendLabels = ['First Label', 'Second Label', 'Third Label', 'Fourth Label'];

  // use copy of this for all tests to ensure each test start with clean configuration
  const defaultVisConfig = {
    type: 'histogram',
    title: {
      'text': 'rows'
    },
    get(attr, defaultValue) {
      return this._values[attr] || defaultValue;
    },
    set(attr, value) {
      this._values[attr] = value;
    },
    _values: {
      addLegend: true,
      addTooltip: true,
      enableHover: true,
      legendPosition: 'top',
      'tooltip.show': true
    },
    data: {
      labels: legendLabels,
      getLabels() {return this.labels; },
      pieNames: jest.fn(),
      getColorFunc() {
        return ((label) => this.uiState.get('vis.colors')[label] || '#AAA');
      },
      type: 'series',
      uiState: {
        get(attr, defaultValue) {
          return this._values[attr] || defaultValue;
        },
        set(attr, value) {
          this._values[attr] = value;
        },
        _values: {
          'vis.legendOpen': true,
          'vis.colors': {
            'First Label': '#111',
            'Second Label': '#222',
            'Third Label': '#333',
            'Fourth Label': '#444'
          }
        }
      },
      data: {
        hits: 15,
        series: [
          {
            'label': 'First Label',
            'aggLabel': 'Count',
            'aggId': '1',
            'values': [
              {
                aggConfigResult: {
                  getPath: () => ([{ key: 'First Label', type: 'bucket', rawData: {} }]),
                  key: 'First Label',
                  type: 'bucket',
                  rawData: {
                    table: {
                      columns: [],
                      rows: []
                    },
                    column: 0,
                    row: 1
                  }
                }
              }
            ]
          },
          {
            'label': 'Second Label',
            'aggLabel': 'Count',
            'aggId': '1',
            'values': []
          },
          {
            'label': 'Third Label',
            'aggLabel': 'Count',
            'aggId': '1',
            'values': []
          },
          {
            'label': 'Fourth Label',
            'aggLabel': 'Count',
            'aggId': '1',
            'values': []
          }
        ]
      }
    }
  };
  const realDateNow = Date.now.bind(global.Date);
  let fakeTime = 0;
  let handler;
  let legend;

  beforeEach(() => {
    // just increment 1 second each time Date.now() is called to make D3 think 1 second has passed
    global.Date.now = jest.fn(() => (fakeTime += 1000));

    const el = d3.select('body')
      .append('div')
      .attr('class', 'vislib-chart')
      .node();

    handler = {
      el,
      visConfig: _.cloneDeep(defaultVisConfig),
      legendPosition: 'top',
      highlight: jest.fn(),
      unHighlight: jest.fn(),
      vis: {
        visConfigArgs: {
          type: 'heatmap'
        },
        getLegendLabels() {
          return legendLabels;
        },
        emit(type, data) {}
      }
    };

    legend = new ChartLegend(handler);
  });

  afterEach(() => {
    d3.select('body')
      .selectAll('*')
      .remove();
    legend = false;
    global.Date.now = realDateNow;
  });


  describe('render and draw', () => {
    it('should return a function from draw', () => {
      expect(_.isFunction(legend.draw()))
        .toBe(true);
    });

    it('should append legend to wrapper', () => {
      legend.render();
      expect(d3.selectAll('.vislib-legend')
        .size())
        .toBe(1);
      expect(d3.select('#' + legend.legendId)
        .empty())
        .toBeFalsy();
      expect(d3.selectAll('.legend-value-title')
        .size())
        .toBe(4);
    });

    it('should remove existing legend from wrapper before drawing new legend', () => {
      const container = d3.select(legend.el);
      container.append('div')
        .attr('id', 'remove_me')
        .attr('class', 'vislib-legend');
      legend.render();
      expect(container.selectAll('.vislib-legend')
        .size())
        .toBe(1);
      expect(container.select('#remove_me')
        .size())
        .toBe(0);
    });
  });


  describe('label location', () => {
    beforeEach(() => legend.render());

    it('should find the label element', () => {
      const labelElement = legend.findLabelElement('Second Label');
      expect(labelElement.attributes.getNamedItem('data-label').value)
        .toBe('Second Label');
    });
  });

  describe('legend position options', () => {
    it('should handle position: top', () => {
      legend.legendPosition = 'top';
      handler.visConfig.data.uiState.set('vis.legendOpen', false);
      legend.render();

      const chartWrapper = d3.select(legend.el);
      expect(chartWrapper.select('i')
        .attr('class'))
        .toMatch(/fa-chevron-circle-down/);

      handler.visConfig.data.uiState.set('vis.legendOpen', true);
      legend.render();
      expect(chartWrapper.select('i')
        .attr('class'))
        .toMatch(/fa-chevron-circle-up/);
    });

    it('should handle position: bottom', () => {
      legend.legendPosition = 'bottom';
      handler.visConfig.data.uiState.set('vis.legendOpen', false);
      legend.render();

      const chartWrapper = d3.select(legend.el);
      expect(chartWrapper.select('i')
        .attr('class'))
        .toMatch(/fa-chevron-circle-up/);

      handler.visConfig.data.uiState.set('vis.legendOpen', true);
      legend.render();
      expect(chartWrapper.select('i')
        .attr('class'))
        .toMatch(/fa-chevron-circle-down/);

      // bottom also should have details panel open upward
      legend.findLabelElement('First Label')
        .querySelector('.legend-value-title')
        .dispatchEvent(new MouseEvent('click'));
      expect(d3.select(legend.el)
        .selectAll('.legend-value-details')
        .empty())
        .toBeFalsy();
      d3.timer.flush();

      expect(d3.select(legend.findLabelElement('First Label'))
        .select('.legend-value-details')
        .style('bottom'))
        .toBeTruthy();
    });

    it('should handle position: left', () => {
      legend.legendPosition = 'left';
      handler.visConfig.data.uiState.set('vis.legendOpen', false);
      legend.render();

      const chartWrapper = d3.select(legend.el);
      // expect(chartWrapper.style('flex-direction')).toBe('row-reverse');
      expect(chartWrapper.select('i')
        .attr('class'))
        .toMatch(/fa-chevron-circle-right/);

      handler.visConfig.data.uiState.set('vis.legendOpen', true);
      legend.render();
      expect(chartWrapper.select('i')
        .attr('class'))
        .toMatch(/fa-chevron-circle-left/);
    });

    it('should handle position: right', () => {
      legend.legendPosition = 'right';
      handler.visConfig.data.uiState.set('vis.legendOpen', false);
      legend.render();

      const chartWrapper = d3.select(legend.el);
      // expect(chartWrapper.style('flex-direction')).toBe('row');
      expect(chartWrapper.select('i')
        .attr('class'))
        .toMatch(/fa-chevron-circle-left/);

      handler.visConfig.data.uiState.set('vis.legendOpen', true);
      legend.render();
      expect(chartWrapper.select('i')
        .attr('class'))
        .toMatch(/fa-chevron-circle-right/);
    });
  });

  describe('highlight handlers', () => {
    beforeEach(() => legend.render());
    afterEach(() => legend.destroy());

    it('should not error on empty label or try to notify', () => {
      legend.handleHighlight();
      legend.handleUnHighlight();
    });

    it('should show tooltip on highlight', () => {
      legend.findLabelElement('Third Label')
        .querySelector('.legend-value-title')
        .dispatchEvent(new MouseEvent('mouseenter', {
          bubbles: true,
          view: window,
          pageX: 11,
          pageY: 22
        }));
      d3.timer.flush();

      const tooltip = d3.select(`#${legend.tooltipId}`);
      expect(tooltip.html())
        .toBe('Third Label');
    });

    it('should call highlight dispatch handler', () => {
      const highlightSpy = jest.spyOn(handler, 'highlight');
      legend.handleHighlight('First Label');
      expect(highlightSpy)
        .toHaveBeenCalledTimes(1);
    });

    it('should call uhhighlight dispatch handler', () => {
      const unHighlightSpy = jest.spyOn(handler, 'unHighlight');
      legend.handleUnHighlight('First Label');
      expect(unHighlightSpy)
        .toHaveBeenCalledTimes(1);
    });

    it('should hide tooltip on unhighlight', () => {
      legend.findLabelElement('Second Label')
        .querySelector('.legend-value-title')
        .dispatchEvent(new MouseEvent('mouseenter', {
          bubbles: true,
          view: window,
          pageX: 11,
          pageY: 22
        }));
      d3.timer.flush();

      expect(d3.select(`#${legend.tooltipId}`)
        .html())
        .toBe('Second Label');

      legend.findLabelElement('Second Label')
        .querySelector('.legend-value-title')
        .dispatchEvent(new MouseEvent('mouseleave', {
          bubbles: true,
          view: window,
          pageX: 11,
          pageY: 22
        }));
      d3.timer.flush();

      expect(d3.select(`#${legend.tooltipId}`)
        .style('opacity'))
        .toBe('0');
    });

  });

  describe('tooltip configuration', () => {
    it('should not show tooltips if they are turned off', () => {
      handler.visConfig.set('tooltip.show', false);
      const noTooltipsLegend = new ChartLegend(handler);

      noTooltipsLegend.render();
      d3.timer.flush();

      expect(noTooltipsLegend.tooltipId)
        .toBeFalsy();

      // make sure highlight does not add tooltip
      legend.findLabelElement('Third Label')
        .querySelector('.legend-value-title')
        .dispatchEvent(new MouseEvent('mouseenter', {
          bubbles: true,
          view: window,
          pageX: 11,
          pageY: 22
        }));
      d3.timer.flush();

      expect(noTooltipsLegend.tooltipId)
        .toBeFalsy();
      expect(d3.select('body')
        .selectAll('.legend-tooltip')
        .empty())
        .toBeTruthy();
      noTooltipsLegend.destroy();
    });
  });


  describe('setColor function', () => {
    it('should be a function', () => {
      expect(_.isFunction(legend.setColor))
        .toBe(true);
    });

    it('should update color in ui state', () => {
      legend.render();
      const origColor = d3.select(legend.findLabelElement('Fourth Label'))
        .select('.fa-circle')
        .style('color');
      const newColor = 'rgb(100, 150, 9)';
      legend.setColor('Fourth Label', newColor);
      legend.render();
      expect(origColor)
        .not
        .toBe(newColor);
      expect(d3.select(legend.findLabelElement('Fourth Label'))
        .select('.fa-circle')
        .style('color'))
        .toBe(newColor);
    });
  });


  describe('legend toggle', () => {
    beforeEach(() => legend.render());

    it('should be a function', () => {
      expect(_.isFunction(legend.toggle))
        .toBe(true);
    });

    it('should show/hide panel when toggled', () => {
      legend.toggle();
      legend.render(); // when running in page, angular digest is triggered by change of uiState
      expect(handler.visConfig.data.uiState.get('vis.legendOpen', false))
        .toBe(false);
      expect(d3.selectAll('.legend-ul')
        .empty())
        .toBeTruthy();

      legend.toggle();
      legend.render();
      expect(handler.visConfig.data.uiState.get('vis.legendOpen', false))
        .toBe(true);
      expect(d3.selectAll('.legend-ul')
        .empty())
        .toBeFalsy();
    });
  });


  describe('build labels', () => {
    it('should be a function', () => {
      expect(_.isFunction(legend.buildLabels))
        .toBe(true);
    });

    let renderSpy;
    let labels;

    beforeEach(() => {
      renderSpy = jest.spyOn(legend, 'render');
    });

    afterEach(() => {
      renderSpy.mockRestore();
      labels = false;
    });

    it('should return loading label and retry render for heatmap/gauge', () => {
      const mappedLabelsSpy = jest.spyOn(handler.vis, 'getLegendLabels');
      handler.vis.visConfigArgs.type = 'heatmap';
      mappedLabelsSpy.mockImplementationOnce(() => {return null;});
      labels = legend.buildLabels();
      expect(labels.length)
        .toBe(1);
      expect(labels[0].label)
        .toBe('legend loading...');
      jest.advanceTimersByTime(100);
      expect(setTimeout)
        .toHaveBeenCalledTimes(1);
      expect(renderSpy)
        .toHaveBeenCalledTimes(1);

      labels = legend.buildLabels();
      jest.runAllTimers();
      expect(labels.length)
        .toBe(4);
      expect(renderSpy)
        .toHaveBeenCalledTimes(1);
      mappedLabelsSpy.mockRestore();

    });

    it('should return pie label names', () => {
      handler.vis.visConfigArgs.type = 'pie';
      const pieSpy = jest.spyOn(legend.data, 'pieNames')
        .mockImplementation();
      labels = legend.buildLabels();
      expect(pieSpy)
        .toHaveBeenCalledTimes(1);
    });

    it('should build labels for other types of charts', () => {
      handler.vis.visConfigArgs.type = 'point_series';
      const labelSpy = jest.spyOn(legend.data, 'getLabels');
      labels = legend.buildLabels();
      expect(labelSpy)
        .toHaveBeenCalledTimes(1);
      expect(labels.length)
        .toBe(4);

      handler.vis.visConfigArgs.type = 'histogram';
      labels = legend.buildLabels();
      expect(labelSpy)
        .toHaveBeenCalledTimes(2);
      expect(labels.length)
        .toBe(4);
    });
  });


  describe('destroy', () => {
    it('should be a function', () => {
      expect(_.isFunction(legend.destroy))
        .toBe(true);
    });

    it('should remove legend', () => {
      legend.render();
      expect(d3.select(legend.el)
        .selectAll('.vislib-legend')
        .size())
        .toBe(1);
      expect(d3.select(`#${legend.tooltipId}`)
        .empty())
        .toBeFalsy();
      legend.destroy();
      expect(d3.select(legend.el)
        .selectAll('.vislib-legend')
        .size())
        .toBe(0);
      expect(d3.select(`#${legend.tooltipId}`)
        .empty())
        .toBeTruthy();
    });
  });


  describe('legend value details panel', () => {
    beforeEach(() => legend.render());

    it('should initialize with no details and toggle when clicked', () => {
      expect(d3.select(legend.el)
        .selectAll('.legend-value-details')
        .empty())
        .toBeTruthy();
      legend.findLabelElement('First Label')
        .querySelector('.legend-value-title')
        .dispatchEvent(new MouseEvent('click'));
      expect(d3.select(legend.el)
        .selectAll('.legend-value-details')
        .empty())
        .toBeFalsy();
      d3.timer.flush();

      expect(d3.select(legend.findLabelElement('First Label'))
        .select('.legend-value-details')
        .style('display'))
        .toBe('block');

      legend.findLabelElement('First Label')
        .querySelector('.legend-value-title')
        .dispatchEvent(new MouseEvent('click'));
      d3.timer.flush();
      expect(d3.select(legend.findLabelElement('First Label'))
        .select('.legend-value-details')
        .style('display'))
        .toBe('none');
    });

    it('should hide all other details panels when opening a new one', () => {
      legend.findLabelElement('First Label')
        .querySelector('.legend-value-title')
        .dispatchEvent(new MouseEvent('click'));
      d3.timer.flush();
      legend.findLabelElement('Third Label')
        .querySelector('.legend-value-title')
        .dispatchEvent(new MouseEvent('click'));
      jest.advanceTimersByTime(700);
      d3.timer.flush();

      expect(d3.select(legend.findLabelElement('First Label'))
        .select('.legend-value-details')
        .style('display'))
        .toBe('none');

      expect(d3.select(legend.findLabelElement('Third Label'))
        .select('.legend-value-details')
        .style('display'))
        .toBe('block');
    });

  });


  describe('dark/light mode', () => {
    it('should show dark theme color panel when dark mode is enabled', () => {
      d3.select('body')
        .attr('class', 'application theme-dark');
      legend.render();
      legend.findLabelElement('First Label')
        .querySelector('.legend-value-title')
        .dispatchEvent(new MouseEvent('click'));
      d3.timer.flush();

      const details = d3.select(legend.findLabelElement('First Label'))
        .select('.legend-value-details');
      expect(details.style('background'))
        .toBe('rgb(34, 34, 34)');
      expect(details.style('color'))
        .toBe('rgb(255, 255, 255)');

      d3.select('body')
        .attr('class', null);
    });

    it('should show light theme color panel when dark mode is disabled', () => {
      legend.render();
      legend.findLabelElement('First Label')
        .querySelector('.legend-value-title')
        .dispatchEvent(new MouseEvent('click'));
      d3.timer.flush();

      const details = d3.select(legend.findLabelElement('First Label'))
        .select('.legend-value-details');
      expect(details.style('background'))
        .toBe('rgb(255, 255, 255)');
      expect(details.style('color'))
        .toBe('rgb(0, 0, 0)');
    });
  });


  describe('filters', () => {

    it('should return a function', () => {
      expect(_.isFunction(legend.filterAddHandler()))
        .toBe(true);
    });

    it('should emit filter update on button click', () => {
      const emitSpy = jest.spyOn(handler.vis, 'emit');

      const filterClickHandler = legend.filterAddHandler();
      filterClickHandler({ label: 'First Label' });

      expect(emitSpy).toHaveBeenCalled();
    });


    it('should not show filter buttons if bucket is not found for label', () => {
      // gauge and heatmap, as well as some others end up in this category
      expect(legend.findBucket('Second Label')).toBeFalsy();
      legend.render();

      const labelElement = legend.findLabelElement('Second Label');
      expect(labelElement).toBeDefined();

      labelElement.querySelector('.legend-value-title')
        .dispatchEvent(new MouseEvent('click'));
      d3.timer.flush();

      expect(d3.select(labelElement)
        .selectAll('.fa-search-plus')
        .empty()).toBeTruthy();

      const labelWithFilterElement = legend.findLabelElement('First Label');
      expect(labelWithFilterElement).toBeDefined();

      labelWithFilterElement.querySelector('.legend-value-title')
        .dispatchEvent(new MouseEvent('click'));
      d3.timer.flush();

      expect(d3.select(labelWithFilterElement)
        .selectAll('.fa-search-plus')
        .size()).toEqual(1);

    });


    it('should handle filter negation', () => {
      const emitSpy = jest.spyOn(handler.vis, 'emit')
        .mockImplementation((type, data) => {
          expect(data.meta.negate).toBeTruthy();
        });
      const filterClickHandler = legend.filterAddHandler(true);
      filterClickHandler({ label: 'First Label' });
      expect(emitSpy).toHaveBeenCalled();

    });

  });


  describe('findBucket function', () => {
    it('should return falsy value if label is not found', () => {
      expect(legend.findBucket()).toBeFalsy();
      expect(legend.findBucket('not present')).toBeFalsy();
      expect(legend.findBucket(-1)).toBeFalsy();
    });

    it('should find bucket for series data', () => {
      expect(legend.findBucket('First Label').key).toEqual('First Label');
    });

    it('should find bucket for slice data', () => {
      delete handler.visConfig.data.data.series;
      handler.visConfig.data.data.slices = { children: [
        {
          aggConfigResult: {
            getPath: () => ([{ key: 'Pie Label 1', type: 'bucket', rawData: {} }]),
            key: 'Pie Label 1',
            type: 'bucket',
            rawData: {
              table: {
                columns: [],
                rows: []
              },
              column: 0,
              row: 1
            }
          }
        },
        {
          aggConfigResult: {
            getPath: () => ([{ key: 'Pie Label 3', type: 'bucket', rawData: {} }]),
            key: 'Pie Label 3',
            type: 'bucket',
            rawData: {
              table: {
                columns: [],
                rows: []
              },
              column: 0,
              row: 3
            }
          }
        }
      ] };
      expect(legend.findBucket('Pie Label 1').key).toEqual('Pie Label 1');
      expect(legend.findBucket('Pie Label 3').key).toEqual('Pie Label 3');
      expect(legend.findBucket()).toBeFalsy();

    });

  });
})
;
