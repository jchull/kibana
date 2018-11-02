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
      this.legendId = htmlIdGenerator()('legend');
      this.tooltips = [];

    }


    /**
     *
     * @returns {*}
     */
    render() {
      return d3.select(this.el)
        .call(this.draw());
    }


    /**
     *
     * @returns {Function}
     */
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
            .attr('focusable', 'true')
            // .on('keypress', () => {
            //   if(d3.event.keyCode === keyCodes.ESCAPE && self.expanded){
            //     self.toggle();
            //   }
            // })
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
            self.getSeriesLabels(self.data)
              .forEach(series => self.renderSeries(ul, series));
          }

        });
      };
    }


    /**
     * Renders all the legend list items
     * @param selection {Object} D3 select UL to add items to
     * @param series
     */
    renderSeries(selection, series) {
      const self = this;

      const color = self.data.getColorFunc()(series.label);
      const li = selection.append('li')
        .attr('class', 'legend-value color')
        .attr('data-label', series.label);
      if(['top', 'bottom'].indexOf(self.visConfig.get('legendPosition')) >= 0) {
        li.style('display', 'inline-block');
      }
      const valueContainer = li.append('div')
        .attr('class', 'legend-value-container');

      const title = valueContainer.append('div')
        .attr('class', 'legend-value-title legend-value-truncate') // TODO: handle full
        .attr('data-label', series.label)
        .on('mouseenter', () => self.handleHighlight(series.label))
        .on('mouseleave', () => self.handleUnHighlight(series.label));

      // TODO: vislib tooltip wants to be in a viz container, does not seem to work without some changes
      title.append('i')
        .attr('class', 'fa fa-circle')
        .style('color', color);
      title.append('span')
        .style('margin-left', '4px')
        .text(series.label);

      self.renderDetail(valueContainer, series.label);

    }


    /**
     *
     * @param selection {Object} D3 select container to add detail to
     * @param label data label
     */
    renderDetail(selection, label) {
      const self = this;

      const valueDetails = selection.append('div')
        .attr('class', 'legend-value-details')
        .style('display', 'none')
        // .style('opacity', '1 !important')
        .style('padding', '4px')
        .style('position', 'absolute')
        .style('background', '#FFF');
      selection.on('click', () => {
        if(valueDetails.style('display') === 'none') {
          self.hideAllDetails();
          valueDetails.style('display', 'block');
        } else {
          valueDetails.style('display', 'none');
        }
      });
      const filterButtonGroup = valueDetails.append('div')
        .attr('class', 'kuiButtonGroup kuiButtonGroup--united kuiButtonGroup--fullWidth');
      filterButtonGroup.append('button')
        .attr('class', 'kuiButton kuiButton--basic kuiButton--small')
        .attr('arial-label', 'Filter for value ' + label)
        //  .on('click', () => {
        // TODO: Filter
        //  })
        .append('span')
        .attr('class', 'kuiIcon fa-search-plus');
      filterButtonGroup.append('button')
        .attr('class', 'kuiButton kuiButton--basic kuiButton--small')
        .attr('arial-label', 'Filter out value ' + label)
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
        .text('Set color for value ' + label);

      COLOR_CHOICES.forEach(colorChoice => {
        colorPicker.append('i')
          .attr('class', 'fa dot fa-circle' + (self.data.getColorFunc()(label) === colorChoice ? '-o' : ''))
          .style('color', colorChoice)
          .on('click', () => self.setColor(label, colorChoice));

      });
    }


    // TODO: sure would be nice to use the dispatcher
    // addEvents(element) {
    //   const events = this.events;
    //
    //   return element
    //     .call(events.addHoverEvent())
    //     .call(events.addMouseoutEvent())
    //     .call(events.addClickEvent());
    // }

    /**
     * Updates color for label, causing chart color to update
     * @param label data label to update color for
     * @param color new color string
     */
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


    /**
     * Toggles display of the legend panel
     * @returns {*}
     */
    toggle() {
      return this.data.uiState.set('vis.legendOpen', !this.expanded);
    }


    /**
     * Hides all detail panels for each legend entry
     */
    hideAllDetails() {
      d3.select(this.el)
        .selectAll('.legend-value-details')
        .style('display', 'none');
    }


    /**
     *
     * @param label
     * @returns {HTMLElement} containing label contents for specified label
     */
    getLabelElement(label) {
      return d3.select(this.el)
        .select('.legend-value[data-label=\'' + label + '\'')
        .node();
    }


    /**
     *
     * @param label
     */
    handleHighlight(label) {
      if(this.handler && typeof this.handler.highlight === 'function') {
        const targetEl = this.getLabelElement(label);
        this.handler.highlight.call(targetEl, this.handler.el);
      }
    }


    /**
     *
     * @param label
     */
    handleUnHighlight(label) {
      if(this.handler && typeof this.handler.highlight === 'function') {
        const targetEl = this.getLabelElement(label);
        this.handler.unHighlight.call(targetEl, this.handler.el);
      }
    }


    // TODO: filter, onLegendEntryKeydown

    // TODO: make sure to test heatmap and gauge

    /**
     *
     *
     * @param data
     * @returns {Array} label text
     */
    getSeriesLabels(data) {
      if(data && data.data && data.data.series) {
        return _.compact(_.uniq(data.data.series, 'label'));
      }
      return [{ label: 'legend loading...' }];
    }


    destroy() {
      // TODO: clean up

    }
  }

  return ChartLegend;
}
