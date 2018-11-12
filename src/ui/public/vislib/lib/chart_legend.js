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

import d3                  from 'd3';
import { htmlIdGenerator } from '@elastic/eui';


export function VislibLibChartLegendProvider() {

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
      iconClass: `${LEGEND_COLLAPSE_ICON}-down`,
      expandedIconClass: `${LEGEND_COLLAPSE_ICON}-up`
    },
    bottom: {
      flexDirection: 'column',
      iconClass: `${LEGEND_COLLAPSE_ICON}-up`,
      expandedIconClass: `${LEGEND_COLLAPSE_ICON}-down`
    },
    left: {
      flexDirection: 'row-reverse',
      iconClass: `${LEGEND_COLLAPSE_ICON}-right`,
      expandedIconClass: `${LEGEND_COLLAPSE_ICON}-left`
    },
    right: {
      flexDirection: 'row',
      iconClass: `${LEGEND_COLLAPSE_ICON}-left`,
      expandedIconClass: `${LEGEND_COLLAPSE_ICON}-right`
    }
  };

  const LOADING_LABEL = { 'label': 'legend loading...' };

  /**
   * Legend visualization for charts
   *
   * @class ChartLegend
   * @constructor
   * @param handler {Object} Reference to Handler instance
   */
  class ChartLegend {
    constructor(handler) {
      this.handler = handler;
      this.data = handler.visConfig.data;
      this.el = handler.el;
      this.legendId = htmlIdGenerator()('legend');
      this.tooltipId = handler.visConfig.get('tooltip.show', false) ? htmlIdGenerator()('legend-tooltip') : null;
      this.legendPosition = handler.visConfig.get('legendPosition', 'right');
    }


    /**
     * Removes any existing legend from container and renders a new one
     */
    render() {
      d3.select(this.el)
        .select('.vislib-legend')
        .remove();
      d3.select(this.el)
        .call(this.draw());
    }


    /**
     * Gets the function which adds chart legend to DOM
     * @returns {Function} D3 selection handler for legend
     */
    draw() {
      const legendPositionOpts = legendPositionMap[this.legendPosition];
      const expanded = this.data.uiState.get('vis.legendOpen', false);

      return selection => selection.each(() => {
        const vislibChart = d3.select(this.el)
          .style('flex-direction', legendPositionOpts.flexDirection);
        const legendWrapper = vislibChart.append('div')
          .attr({
            id: () => this.legendId,
            class: 'vislib-legend legend-col-wrapper'
          });
        legendWrapper.append('button')
          .attr({
            class: 'kuiCollapseButton legend-collapse-button',
            'aria-label': 'Toggle Legend',
            'aria-expanded': expanded,
            'aria-controls': () => this.legendId
          })
          .on('click', () => this.toggle())
          .append('i')
          .attr('class', `fa ${expanded ? legendPositionOpts.expandedIconClass : legendPositionOpts.iconClass}`);

        if(expanded) {
          ChartLegend.renderTooltip(this.tooltipId);
          legendWrapper.call(() => this.renderLabels(this.buildLabels()));
        }

      });
    }

    /**
     * Removes any existing legend tooltips by ID and adds a new one
     *
     * @param tooltipId {String} unique ID for tooltip container, null if tooltips disabled
     */
    static renderTooltip(tooltipId) {
      if(!tooltipId) {
        return;
      }
      d3.select(`#${tooltipId}`)
        .remove();
      d3.select('body')
        .append('div')
        .attr({
          id: tooltipId,
          class: 'legend-tooltip'
        })
        .style({
          opacity: '0',
          position: 'absolute',
          padding: '2px',
          color: '#FFF',
          background: '#000',
          'border-radius': '3px',
          'z-index': '1000'
        });
    }


    /**
     * Gets a function which renders all the legend list items
     *
     * @returns {Function} takes (selection, labelConfig)
     */
    renderLabels(labels) {
      const colorFn = this.data.getColorFunc();
      const position = this.legendPosition;
      const title = d3.select(this.el)
        .select('.vislib-legend')
        .append('ul')
        .attr('class', 'legend-ul')
        .selectAll('li')
        .data(labels)
        .enter()
        .append('li')
        .attr({
          class: 'legend-value color',
          'data-label': d => d.label
        })
        .style('display', ['top', 'bottom'].includes(position) ? 'inline-block' : null)
        .append('div')
        .attr('class', 'legend-value-container')
        .append('div')
        .attr({
          class: 'legend-value-title legend-value-truncate',
          'data-label': d => d.label
        })
        .on('mouseenter', this.highlightHandler(true))
        .on('mouseleave', this.highlightHandler(false))
        .on('click', this.toggleDetail());

      title.append('i')
        .attr('class', 'fa fa-circle')
        .style('color', d => colorFn(d.label));
      title.append('span')
        .style('margin-left', '4px')
        .text(d => d.label);
    }


    /**
     * Toggles visibility of legend label details panel
     *
     * @returns {Function} (d) D3 selection handler function
     */
    toggleDetail() {
      const colorFn = this.data.getColorFunc();
      const isDark = !d3.selectAll('.application.theme-dark')
        .empty();
      return d => {
        const labelContainer = d3.select(this.findLabelElement(d.label));
        let detailContainer = labelContainer.select('.legend-value-details');
        if(!detailContainer || detailContainer.empty()) {
          detailContainer = labelContainer.append('div')
            .attr({
              class: 'legend-value-details',
              'data-label': d.label
            })
            .style({
              opacity: '0.9',
              display: 'none',
              overflow: 'hidden',
              'max-height': '0',
              padding: '4px',
              position: 'absolute',
              'box-shadow': '2px 2px 3px #222',
              background: isDark ? '#222' : '#FFF',
              color: isDark ? '#FFF' : '#000',
              bottom: this.legendPosition === 'bottom' ? `${labelContainer.node()
                .getBoundingClientRect().height + 5}px` : null
            });
          const filterButtonGroup = detailContainer.append('div')
            .attr('class', 'kuiButtonGroup kuiButtonGroup--united kuiButtonGroup--fullWidth');
          filterButtonGroup.append('button')
            .attr({
              class: 'kuiButton kuiButton--basic kuiButton--small',
              'arial-label': `Filter for value ${d.label}`,
              'data-label': d.label
            })
            .on('click', () => this.filterClickHandler(d.label, false))
            .append('span')
            .attr('class', 'kuiIcon fa-search-plus');
          filterButtonGroup.append('button')
            .attr({
              class: 'kuiButton kuiButton--basic kuiButton--small',
              'arial-label': `Filter out value ${d.label}`,
              'data-label': d.label
            })
            .on('click', () => this.filterClickHandler(d.label, true))
            .append('span')
            .attr('class', 'kuiIcon fa-search-minus');
          const colorPicker = detailContainer.append('div')
            .attr({
              class: 'legend-value-color-picker',
              role: 'listbox'
            });
          colorPicker.append('span')
            .attr({
              id: `${() => this.legendId}ColorPickerDesc`,
              class: 'kuiScreenReaderOnly'
            })
            .text(`Set color for value ${d.label}`);
          colorPicker.selectAll('i')
            .data(COLOR_CHOICES)
            .enter()
            .append('i')
            .style('color', color => color)
            .attr('class', color => `fa dot fa-circle ${colorFn(d.label) === color ? '-o' : ''}`)
            .on('click', color => this.setColor(d.label, color));
        }
        if(detailContainer.style('display') !== 'block') {
          this.hideAllDetails(true);
          detailContainer.transition(500)
            .style({
              'max-height': '200px',
              display: 'block'
            });
        } else {
          this.hideAllDetails();
        }
      };
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
     */
    toggle() {
      const expanded = this.data.uiState.get('vis.legendOpen', false);
      this.data.uiState.set('vis.legendOpen', !expanded);
    }


    /**
     * Hides all legend detail panels in the page
     *
     * @param skipAnimation if true, will skip transition animation
     */
    hideAllDetails(skipAnimation) {
      d3.select(this.el)
        .selectAll('.legend-value-details')
        .transition(skipAnimation ? 0 : 500)
        .style({
          'max-height': '0',
          display: 'none'
        });
    }


    /**
     * Finds the element given the label text by matching data-label attr
     * @param label
     * @returns {HTMLElement} containing label contents for specified label
     */
    findLabelElement(label) {
      return d3.select(this.el)
        .select(`.legend-value[data-label='${label}']`)
        .node();
    }

    /**
     * Returns handler for highlight/unhighlight
     * @param on highlight if true, defaults to false/unhighlight
     */
    highlightHandler(on = false) {
      if(on) {
        return d => this.handleHighlight(d.label);
      } else {
        return d => this.handleUnHighlight(d.label);
      }
    }


    /**
     * Handles mouseenter event on legend labels
     * @param label data-label attribute value
     */
    handleHighlight(label) {
      if(!label || !this.handler || typeof this.handler.highlight !== 'function') {
        return;
      }

      if(d3.event && this.tooltipId) {
        d3.select(`#${this.tooltipId}`)
          .style({
            opacity: '0.9',
            top: `${d3.event.pageY}px`,
            right: () => (this.legendPosition === 'right' ? `${window.innerWidth - d3.event.pageX}px` : null),
            left: () => (this.legendPosition !== 'right' ? `${d3.event.pageX}px` : null)
          })
          .html(label);
      }
      const targetEl = this.findLabelElement(label);
      this.handler.highlight.call(targetEl, this.el);
    }


    /**
     * Handles mouseleave event on legend labels
     * @param label data-label attribute value
     */
    handleUnHighlight(label) {
      if(!label || !this.handler || typeof this.handler.unHighlight !== 'function') {
        return;
      }
      if(this.tooltipId) {
        d3.select(`#${this.tooltipId}`)
          .style('opacity', 0);
      }
      const targetEl = this.findLabelElement(label);
      this.handler.unHighlight.call(targetEl, this.el);
    }


    /**
     * build labels to display or show loading message
     */
    buildLabels() {
      const chartType = this.handler.vis.visConfigArgs.type;

      if(!this.data || !this.data.data) {
        return [LOADING_LABEL];
      }

      if(['heatmap', 'gauge'].includes(chartType)) {
        const labels = this.handler.vis.getLegendLabels();
        if(!labels) {
          setTimeout(() => this.render(), 100);
          return [LOADING_LABEL];
        }
        return labels.map(label => ({ label }));
      } else if(chartType === 'pie') {
        return this.data.pieNames(this.data.data.columns || this.data.data.rows || [this.data.data]);
      }
      return this.data.getLabels()
        .map(label => ({ label }));

    }


    filterClickHandler(label, negate = false) {
      return label => this.handleFilterClick(label, negate);
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
      d3.select(`#${this.tooltipId}`)
        .remove();
    }
  }

  return ChartLegend;
}
