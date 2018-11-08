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

import d3                        from 'd3';
import { htmlIdGenerator }       from '@elastic/eui';
import { VislibLibDataProvider } from './data';


export function VislibLibChartLegendProvider(Private) {
  const Data = Private(VislibLibDataProvider);

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

  const LOADING_LABEL = { 'label': 'legend loading...' };

  /**
   * Legend visualization for charts
   *
   * @class ChartLegend
   * @constructor
   * @param handler {Object} Reference to Handler instance
   * @param visConfig {Object}
   */
  class ChartLegend {
    constructor(handler, visConfig) {
      this.visConfig = visConfig;
      this.handler = handler;
      this.data = this.visConfig.data;
      this.el = this.handler.el;
      this.expanded = this.data.uiState.get('vis.legendOpen', false);
      this.legendId = htmlIdGenerator()('legend');
      this.legendPosition = this.visConfig.get('legendPosition', 'right');
      this.tooltip = this.showTooltip = this.visConfig.get('tooltip.show', false);
    }


    /**
     * Removes any existing legend from container and renders a new one
     */
    render() {
      const self = this;
      const container = d3.select(self.el);
      container.select('.vislib-legend')
        .remove();
      container.call(self.draw());
    }


    /**
     *
     * @returns {Function}
     */
    draw() {
      const self = this;
      const legendPositionOpts = legendPositionMap[self.legendPosition];
      return function (selection) {
        selection.each(function () {
          const vislibChart = d3.select(this);
          if(self.showTooltip) {
            d3.select('body')
              .selectAll('.legend-tooltip')
              .remove();
            self.tooltip = d3.select('body')
              .append('div')
              .attr('class', 'legend-tooltip')
              .style('opacity', 0)
              .style('position', 'absolute')
              .style('padding', '2px')
              .style('color', '#FFF')
              .style('background', '#000')
              .style('border-radius', '3px')
              .style('z-index', 1000);
          }
          vislibChart.style('flex-direction', legendPositionOpts.flexDirection)
            .append('div')
            .attr('id', self.legendId)
            .attr('class', 'vislib-legend legend-col-wrapper')
            .data([self.data])
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
            self.buildLabels()
              .forEach(labelConfig => self.renderLabels(ul, labelConfig));
          }

        });
      };
    }


    /**
     * Renders all the legend list items
     * @param selection {Object} D3 select UL to add items to
     * @param labelConfig{Object}
     */
    renderLabels(selection, labelConfig) {
      const self = this;
      const label = labelConfig.label;
      const color = self.data.getColorFunc()(label);
      const li = selection.append('li')
        .attr('class', 'legend-value color')
        .data([label])
        .attr('data-label', label);
      if(['top', 'bottom'].indexOf(self.legendPosition) >= 0) {
        li.style('display', 'inline-block');
      }
      const valueContainer = li.append('div')
        .attr('class', 'legend-value-container');

      const title = valueContainer.append('div')
        .attr('class', 'legend-value-title legend-value-truncate') // TODO: handle full
        .data([label])
        .attr('data-label', label)
        .on('mouseenter', () => self.handleHighlight(label))
        .on('mouseleave', () => self.handleUnHighlight(label));

      title.append('i')
        .attr('class', 'fa fa-circle')
        .style('color', color);
      title.append('span')
        .style('margin-left', '4px')
        .text(label);

      self.renderDetail(valueContainer, label);

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
        .attr('data-label', label)
        .style('display', 'none')
        .style('padding', '4px')
        .style('position', 'absolute')
        .style('box-shadow', '2px 2px 3px #222');
      selection.on('click', () => {
        if(valueDetails.style('display') === 'none') {
          self.hideAllDetails();
          const isDark = !d3.selectAll('.application.theme-dark')
            .empty();
          valueDetails
            .style('background', isDark ? '#222' : '#FFF')
            .style('color', isDark ? '#FFF' : '#000')
            .style('display', 'block');
        } else {
          valueDetails.style('display', 'none');
        }
      });
      const filterButtonGroup = valueDetails.append('div')
        .attr('class', 'kuiButtonGroup kuiButtonGroup--united kuiButtonGroup--fullWidth');
      filterButtonGroup.append('button')
        .attr('class', 'kuiButton kuiButton--basic kuiButton--small')
        .attr('arial-label', 'Filter for value ' + label)
        .attr('data-label', label)
        .on('click', () => self.handleFilterClick())
        .append('span')
        .attr('class', 'kuiIcon fa-search-plus');
      filterButtonGroup.append('button')
        .attr('class', 'kuiButton kuiButton--basic kuiButton--small')
        .attr('arial-label', 'Filter out value ' + label)
        .attr('data-label', label)
        .on('click', () => self.handleFilterClick(true))
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


    /**
     * Updates color for label, causing chart color to update
     * @param label data label to update color for
     * @param color new color string
     */
    setColor(label, color) {
      const uiState = this.data.uiState;
      const colors = uiState.get('vis.colors') || {};
      if(colors[label] === color) {
        delete colors[label];
      } else {
        colors[label] = color;
      }
      uiState.set('vis.colors', colors);
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
        .select(`.legend-value[data-label='${label}`)
        .node();
    }


    /**
     *
     * @param label
     */
    handleHighlight(label) {
      const self = this;
      if(!label || !self.handler || typeof self.handler.highlight !== 'function') {
        return;
      }

      if(self.tooltip) {
        self.tooltip.transition()
          .duration(200)
          .style('opacity', .9);
        self.tooltip.selectAll('*')
          .remove();
        const tooltipContent = self.tooltip.html(label)
          .style('top', d3.event.pageY + 'px');
        if(self.legendPosition === 'right') {
          tooltipContent.style('right', '60px');
        } else {
          tooltipContent.style('left', d3.event.pageX + 'px');
        }
      }
      const targetEl = self.getLabelElement(label);
      self.handler.highlight.call(targetEl, self.el);
    }


    /**
     *
     * @param label
     */
    handleUnHighlight(label) {
      const self = this;
      if(!label || !self.handler || typeof self.handler.unHighlight !== 'function') {
        return;
      }
      if(self.tooltip) {
        self.tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      }
      const targetEl = self.getLabelElement(label);
      self.handler.unHighlight.call(targetEl, self.el);
    }


    /**
     * build labels to display or show loading message
     */
    buildLabels() {
      const self = this;
      const chartType = self.handler.vis.visConfigArgs.type;

      if(!self.data || !self.data.data) {
        return [LOADING_LABEL];
      }

      if(['heatmap', 'gauge'].includes(chartType)) {
        const labels = self.handler.vis.getLegendLabels();
        if(!labels) {
          setTimeout(() => self.render(), 100);
          return [LOADING_LABEL];
        }
        return labels.map((label) => {return { label };});
      } else if(chartType === 'pie') {
        return Data.prototype.pieNames(self.data.data.columns || self.data.data.rows || [self.data.data]);
      }
      return self.data.getLabels()
        .map((label) => {return { label };});

    }


    handleFilterClick(/*negate*/) {
      // const event = d3.event;
      // const label = event.target.getAttribute('data-label');
      // const series = this.data.data.series;
      // const targetSeries = series.find((ser) => ser.label === label);
    }


    /**
     * Removes legend from container and cleans up tooltip
     */
    destroy() {
      d3.select(this.el)
        .selectAll('.vislib-legend')
        .remove();
      d3.select('body')
        .selectAll('.legend-tooltip')
        .remove();
    }
  }

  return ChartLegend;
}
