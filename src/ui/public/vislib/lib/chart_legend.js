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

import _                                 from 'lodash';
import { VislibLibErrorHandlerProvider } from './_error_handler';
import d3                                from 'd3';
import { htmlIdGenerator }     from '@elastic/eui';


export function VislibLibChartLegendProvider(Private) {
  const ErrorHandler = Private(VislibLibErrorHandlerProvider);

  const COLOR_CHOICES = [
    '#3F6833', '#967302', '#2F575E', '#99440A', '#58140C', '#052B51', '#511749', '#3F2B5B', //6
    '#508642', '#CCA300', '#447EBC', '#C15C17', '#890F02', '#0A437C', '#6D1F62', '#584477', //2
    '#629E51', '#E5AC0E', '#64B0C8', '#E0752D', '#BF1B00', '#0A50A1', '#962D82', '#614D93', //4
    '#7EB26D', '#EAB839', '#6ED0E0', '#EF843C', '#E24D42', '#1F78C1', '#BA43A9', '#705DA0', // Normal
    '#9AC48A', '#F2C96D', '#65C5DB', '#F9934E', '#EA6460', '#5195CE', '#D683CE', '#806EB7', //5
    '#B7DBAB', '#F4D598', '#70DBED', '#F9BA8F', '#F29191', '#82B5D8', '#E5A8E2', '#AEA2E0', //3
    '#E0F9D7', '#FCEACA', '#CFFAFF', '#F9E2D2', '#FCE2DE', '#BADFF4', '#F9D9F9', '#DEDAF7'  //7
  ];

  const LEGEND_COLLAPSE_ICON = 'fa-chevron-circle';
  const legendPositionMap = {
    top: {
      flexDirection: 'column-reverse',
      iconClass: LEGEND_COLLAPSE_ICON + '-down',
      expandedIconClass: LEGEND_COLLAPSE_ICON + '-up'
    },
    bottom: {
      flexDirection: 'column',
      iconClass: LEGEND_COLLAPSE_ICON + '-up',
      expandedIconClass: LEGEND_COLLAPSE_ICON + '-down'
    },
    left: {
      flexDirection: 'row-reverse',
      iconClass: LEGEND_COLLAPSE_ICON + '-right',
      expandedIconClass: LEGEND_COLLAPSE_ICON + '-left'
    },
    right: {
      flexDirection: 'row',
      iconClass: LEGEND_COLLAPSE_ICON + '-left',
      expandedIconClass: LEGEND_COLLAPSE_ICON + '-right'
    }
  };

  // TODO: config class for legend, with ui to configure it in visualize
  class ChartLegend extends ErrorHandler {
    constructor(handler, visConfig) {
      super();
      this.visConfig = visConfig;
      this.handler = handler;

      this.data = this.visConfig.data;
      this.el = this.visConfig.get('el');
      this.expanded = this.visConfig.data.uiState.get('vis.legendOpen');
      //this.clickHandler = new FilterBarClickHandler(this.data.uiState);
      this.legendId = htmlIdGenerator()('legend');
      this.tooltips = [];

    }


    render() {
      return d3.select(this.el)
        .call(this.draw());
    }


    draw() {
      const self = this;
      const legendPositionOpts = legendPositionMap[self.visConfig.get('legendPosition')];
      //const formatter = self.data.get('tooltipFormatter');
      //const showTooltip = self.visConfig.get('tooltip.show');

      // TODO: ARIA?
      return function (selection) {
        selection.each(function () {
          const vislibChart = d3.select(this);
          vislibChart.style('flex-direction', legendPositionOpts.flexDirection)
            .append('div')
            .attr('id', self.legendId)
            .attr('class', 'vislib-legend legend-col-wrapper')
            .append('button')
            .attr('class', 'kuiCollapseButton legend-collapse-button')
            .attr('aria-label', 'Toggle Legend')
            .attr('aria-expanded', self.expanded)
            .attr('aria-controls', self.legendId)
            .on('click', () => self.toggle())
            .append('i')
            .attr('class', 'fa ' + (self.expanded ? legendPositionOpts.expandedIconClass : legendPositionOpts.iconClass));

          if(self.expanded) {
            const ul = vislibChart.select('.vislib-legend')
              .append('ul')
              .attr('class', 'legend-ul');
            // TODO: break out each legend item to own component

            self.getSeriesLabels(self.data)
              .forEach(series => {
                const color = self.data.getColorFunc()(series.label);
                const li = ul.append('li')
                  .attr('class', 'legend-value color')
                  .attr('data-label', series.label);
                if(['top', 'bottom'].indexOf(self.visConfig.get('legendPosition')) >= 0) {
                  li.style('display', 'inline-block');
                }
                const valueContainer = li.append('div')
                  .attr('class', 'legend-value-container');

                const title = valueContainer.append('div')
                  .attr('class', 'legend-value-title legend-value-truncate') // TODO: handle full
                  .attr('data-label', series.label);
                title.on('mouseenter', () => self.highlight(this))
                  .on('mouseleave', () => self.unHighlight(this));

                // TODO: vislib tooltip wants to be in a viz container, does not seem to work without some changes
                title.append('i')
                  .attr('class', 'fa fa-circle')
                  .style('color', self.data.getColorFunc()(series.label));
                title.append('span')
                  .style('margin-left', '4px')
                  .text(series.label);

                const valueDetails = valueContainer.append('div')
                  .attr('class', 'legend-value-details')
                  .style('display', 'none')
                  .style('padding', '4px')
                  .style('position', 'absolute')
                  .style('background', '#FFF');
                title.on('click', () => {
                  if(valueDetails.style('display') === 'none') {
                    valueDetails.style('display', 'block');
                  } else {
                    valueDetails.style('display', 'none');
                  }
                });
                const filterButtonGroup = valueDetails.append('div')
                  .attr('class', 'kuiButtonGroup kuiButtonGroup--united kuiButtonGroup--fullWidth');
                filterButtonGroup.append('button')
                  .attr('class', 'kuiButton kuiButton--basic kuiButton--small')
                  .attr('arial-label', 'Filter for value ' + series.label)
                  //  .on('click', () => {
                  // TODO: Filter
                  //  })
                  .append('span')
                  .attr('class', 'kuiIcon fa-search-plus');
                filterButtonGroup.append('button')
                  .attr('class', 'kuiButton kuiButton--basic kuiButton--small')
                  .attr('arial-label', 'Filter out value ' + series.label)
                  //.on('click', () => {
                  // TODO: Filter
                  //})
                  .append('span')
                  .attr('class', 'kuiIcon fa-search-minus');

                const colorPicker = valueDetails.append('div')
                  .attr('class', 'legend-value-color-picker')
                  .attr('role', 'listbox');
                colorPicker.append('span')
                  .attr('id', self.legendId + 'ColorPickerDesc')
                  .attr('class', 'kuiScreenReaderOnly')
                  .text('Set color for value ' + series.label);

                COLOR_CHOICES.forEach(colorChoice => {
                  colorPicker.append('i')
                    .attr('class', 'fa dot fa-circle' + (color === colorChoice ? '-o' : ''))
                    .style('color', colorChoice)
                    .on('click', () => self.setColor(series.label, colorChoice));

                });
                // self.addEvents(title);
              });
          }

        });
      };
    }


    // addEvents(element) {
    //   const events = this.events;
    //
    //   return element
    //     .call(events.addHoverEvent())
    //     .call(events.addMouseoutEvent())
    //     .call(events.addClickEvent());
    // }

    setColor(label, color) {
      const uiState = this.visConfig.data.uiState;
      const colors = uiState.get('vis.colors') || {};
      if(colors[label] === color) {
        delete colors[label];
      } else {
        colors[label] = color;
      }
      uiState.set('vis.colors', colors);
      uiState.emit('colorChanged');
    }


    toggle() {
      return this.data.uiState.set('vis.legendOpen', !this.expanded);
    }


    highlight(targetEl) {
      if(this.handler && typeof this.handler.highlight === 'function') {
        this.handler.highlight.call(targetEl, this.handler.el);
      }
    }


    unHighlight(targetEl) {
      if(this.handler && typeof this.handler.highlight === 'function') {
        this.handler.unHighlight.call(targetEl, this.handler.el);
      }
    }



    // TODO: filter, onLegendEntryKeydown

    // TODO: make sure to test heatmap and gauge
    getSeriesLabels(data) {
      if(data && data.data && data.data.series) {
        return _.compact(_.uniq(data.data.series, 'label')); // TODO: chaining discussion
      }
      return [{ label: 'legend loading...' }];
    }


    destroy() {
      // TODO: clean up

    }
  }

  return ChartLegend;
}
