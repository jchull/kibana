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
      iconClass: `${LEGEND_COLLAPSE_ICON}-down`,
      expandedIconClass: `${LEGEND_COLLAPSE_ICON}-up`
    },
    bottom: {
      iconClass: `${LEGEND_COLLAPSE_ICON}-up`,
      expandedIconClass: `${LEGEND_COLLAPSE_ICON}-down`
    },
    left: {
      iconClass: `${LEGEND_COLLAPSE_ICON}-right`,
      expandedIconClass: `${LEGEND_COLLAPSE_ICON}-left`
    },
    right: {
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
      d3.select(this.el.parentNode)
        .select('.visLegend')
        .remove();
      d3.select(this.el.parentNode)
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
        const vislibContainer = d3.select(this.el.parentNode)
          .classed(`visLib--legend-${this.legendPosition}`, true);
        const legendWrapper = vislibContainer.append('div')
          .attr({
            id: () => this.legendId,
            class: `visLegend visLib--legend-${this.legendPosition}`
          })
          .classed('expanded', expanded);
        legendWrapper.append('button')
          .attr('class', 'kuiCollapseButton visLegend__toggle')
          .attr({
            'aria-label': 'Toggle Legend',
            'aria-expanded': expanded,
            'aria-controls': () => this.legendId
          })
          .on('click', () => this.toggle())
          .append('i')
          .attr('class', `kuiIcon fa ${expanded ? legendPositionOpts.expandedIconClass : legendPositionOpts.iconClass}`);

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
      const title = d3.select(this.el.parentNode)
        .select('.visLegend')
        .append('ul')
        .attr('class', 'visLegend__list')
        .selectAll('li')
        .data(labels)
        .enter()
        .append('li')
        .attr({
          class: 'visLegend__value color',
          'data-label': d => d.label
        })
        .append('div')
        // TODO: when details disclosed, show full label visLegend__valueTitle--full
        .attr({
          class: 'visLegend__valueTitle visLegend__valueTitle--truncate',
          'data-label': d => d.label
        })
        .on('mouseenter', this.highlightHandler(true))
        .on('mouseleave', this.highlightHandler(false))
        .on('click', this.toggleDetail());

      title.append('i')
        .attr('class', 'fa dot fa-circle')
        .style('color', d => colorFn(d.label));
      title.append('span')
        .text(d => d.label)
        .classed('visLegend__valueTitleText', true);
    }


    /**
     * Toggles visibility of legend label details panel
     *
     * @returns {Function} (d) D3 selection handler function
     */
    toggleDetail() {
      const colorFn = this.data.getColorFunc();
      return d => {
        const labelContainer = d3.select(this.findLabelElement(d.label));
        let detailContainer = labelContainer.select('.visLegend__valueDetails');
        if(!detailContainer || detailContainer.empty()) {
          detailContainer = labelContainer.append('div')
            .attr({
              class: 'visLegend__valueDetails',
              'data-label': d.label
            })
            .style({
              bottom: this.legendPosition === 'bottom' ? `${labelContainer.node()
                .getBoundingClientRect().height + 5}px` : null
            });
          if(!d.hideFilter) {
            const filterButtonGroup = detailContainer.append('div')
              .attr('class', 'kuiButtonGroup kuiButtonGroup--united kuiButtonGroup--fullWidth');
            filterButtonGroup.append('button')
              .attr({
                class: 'kuiButton kuiButton--basic kuiButton--small',
                'arial-label': `Filter for value ${d.label}`,
                'data-label': d.label
              })
              .on('click', this.filterAddHandler())
              .append('span')
              .attr('class', 'kuiIcon fa-search-plus');
            filterButtonGroup.append('button')
              .attr({
                class: 'kuiButton kuiButton--basic kuiButton--small',
                'arial-label': `Filter out value ${d.label}`,
                'data-label': d.label
              })
              .on('click', this.filterAddHandler(true))
              .append('span')
              .attr('class', 'kuiIcon fa-search-minus');
          }
          const colorPicker = detailContainer.append('div')
            .attr({
              class: 'visLegend__valueColorPicker',
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
            .attr('class', color => `fa dot visLegend__valueColorPickerDot fa-circle${colorFn(d.label) === color ? '-o' : ''}`)
            .on('click', color => this.setColor(d.label, color));
        }
        if(detailContainer.style('display') !== 'block') {
          this.hideAllDetails(true);
          detailContainer.transition()
            .delay(100)
            .style({
              'max-height': '200px',
              display: 'block'
            });
        } else {
          detailContainer.transition()
            .delay(100)
            .style({
              'max-height': '0',
              display: 'none'
            });
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
     */
    hideAllDetails() {
      d3.select('body')
        .selectAll('.visLegend__valueDetails')
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
      return d3.select(this.el.parentNode)
        .select(`.visLegend__value[data-label='${label}']`)
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
        const tooltip = d3.select(`#${this.tooltipId}`);
        tooltip.html(label)
          .style({
            top: `${d3.event.pageY + 10}px`,
            right: () => (this.legendPosition === 'right' ? `${window.innerWidth - d3.event.pageX + 10}px` : null),
            left: () => (this.legendPosition !== 'right' ? `${d3.event.pageX}px` : null)
          });
        tooltip.transition()
          .delay(100)
          .style({
            opacity: '0.9'
          });
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
        const tooltip = d3.select(`#${this.tooltipId}`);
        tooltip.transition()
          .delay(200)
          .style({
            opacity: 0
          });
        tooltip.style({ top: '-100px' });
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
        return labels.map(label => ({
          label,
          hideFilter: !this.findBucket(label)
        }));
      } else if(chartType === 'pie') {
        return this.data.pieNames(this.data.data.columns || this.data.data.rows || [this.data.data]);
      }
      return this.data.getLabels()
        .map(label => ({
          label,
          hideFilter: !this.findBucket(label)
        }));

    }

    /**
     * Searches for bucket in data for given label. Also used to determine if filter buttons should show for label.
     * @param label
     * @returns {*}
     */
    findBucket(label) {
      if(!label) {
        return false;
      }
      const chartType = this.handler.vis.visConfigArgs.type;
      if(chartType === 'pie' && this.data.data.slices) {
        return this.data.data.slices.children.find(slice => slice && slice.name === label) ||
               this.data.data.slices.children.reduce((acc, cur) => acc.concat(cur.children), [])
                 .find(slice => slice && slice.name === label);
      }

      const series = this.data.data.series &&
                     this.data.data.series.find(series => series && series.label === label && series.values);
      if(series && series.values.length) {
        return series.values[0];
        // .aggConfigResult.getPath()
        //   .find(aggConfigResult => aggConfigResult && label === aggConfigResult.key && aggConfigResult.type === 'bucket');
      }
    }


    /**
     * Creates function for handling of click events on filter buttons
     * @param negate truthy value filters out the clicked bucket
     * @returns {Function}
     */
    filterAddHandler(negate = false) {
      return d => {
        if(!d) {
          return false;
        }
        const bucket = this.findBucket(d.label);
        if(bucket) {
          this.handler.vis.emit('click', {
            datum: bucket,
            negate: negate
          });
        }
      };
    }


    /**
     * Removes legend from container and cleans up tooltip
     */
    destroy() {
      d3.select(this.el.parentNode)
        .classed(`visLib--legend-${this.legendPosition}`, false)
        .selectAll('.visLegend')
        .remove();
      if(this.tooltipId) {
        d3.select(`#${this.tooltipId}`)
          .remove();
      }
    }
  }

  return ChartLegend;
}
