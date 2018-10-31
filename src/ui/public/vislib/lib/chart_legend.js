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
import { TooltipProvider }               from '../../vis/components/tooltip/index';
import d3                                from 'd3';


export function VislibLibChartLegendProvider(Private) {
  const ErrorHandler = Private(VislibLibErrorHandlerProvider);
  const Tooltip = Private(TooltipProvider);

  const LEGEND_COLLAPSE_ICON = 'fa-chevron-circle';
  const legendPositionMap = {
    top: {
      flexDirection: 'column',
      iconClass: LEGEND_COLLAPSE_ICON + '-down',
      expandedIconClass: LEGEND_COLLAPSE_ICON + '-up'
    },
    bottom: {
      flexDirection: 'column-reverse',
      iconClass: LEGEND_COLLAPSE_ICON + '-up',
      expandedIconClass: LEGEND_COLLAPSE_ICON + '-down'
    },
    left: {
      flexDirection: 'row',
      iconClass: LEGEND_COLLAPSE_ICON + '-right',
      expandedIconClass: LEGEND_COLLAPSE_ICON + '-left'
    },
    right: {
      flexDirection: 'row-reverse',
      iconClass: LEGEND_COLLAPSE_ICON + '-left',
      expandedIconClass: LEGEND_COLLAPSE_ICON + '-right'
    }
  };

  // TODO: config class for legend, with ui to configure it in visualize
  class ChartLegend extends ErrorHandler {
    constructor(el, visConfig) {
      super();
      this.visConfig = visConfig;
      this.data = visConfig.data;
      this.el = el;
      this.tooltip = new Tooltip('legend-value-container', this.el, function (d) {
        return '<p>' + _.escape(d.label) + '</p>';
      });
    }


    render() {
      return d3.select(this.el)
        .call(this.draw());
    }


    draw() {
      const self = this;
      const legendPosition = legendPositionMap[self.visConfig.get('legendPosition')];
      const legendExpanded = self.visConfig.data.uiState.get('vis.legendOpen');

      return function (selection) {
        selection.each(function () {
          const vislibChart = d3.select(this);
          vislibChart.style('flex-direction', legendPosition.flexDirection)
            .append('div')
            .attr('class', 'vislib-legend legend-col-wrapper')
            .append('button') // TODO: add button and toggle handler function
            .attr('class', 'kuiCollapseButton legend-collapse-button')
            .append('i')
            .attr('class', 'fa ' + (legendExpanded ? legendPosition.expandedIconClass : legendPosition.iconClass));

          if(legendExpanded) {
            const ul = vislibChart.select('.vislib-legend')
              .append('ul')
              .attr('class', 'legend-ul');
            // TODO: break out each legend item to own component

            self.getSeriesLabels(self.data)
              .forEach(series => {
                const title = ul.append('li')
                  .attr('class', 'legend-value color')
                  .append('div')
                  .attr('class', 'legend-value-container')
                  .append('div')
                  .attr('class', 'legend-value-title legend-value-truncate');// TODO: handle full
                title.append('i')
                  .attr('class', 'fa fa-circle')
                  .style('color', self.data.getColorFunc()(series.label));
                //TODO: tooltip
                title.append('span') // TODO: needs leading whitespace
                  .text(series.label);
              });
          }

        });
      };
    }


    addMouseEvents(target) {
      if(this.tooltip) {
        return target.call(this.tooltip.render());
      }
    }


    toggle() {
      // TODO:
    }


    // highlight(event) {
    //   // TODO: call handler highlight function
    // }
    //
    //
    // setColor(label, color) {
    //   // TODO:
    // }

    // TODO: filter, canFilter, onLegendEntryKeydown
    // TODO: show details

    // TODO: make sure to test heatmap and gauge
    getSeriesLabels(data) {
      if(data && data.data && data.data.series) {
        return _.compact(_.uniq(data.data.series, 'label')); // TODO: chaining discussion
      }
      return [{ label: 'new legend loading...' }];
    }


    destroy() {
      // TODO: clean up

    }
  }

  return ChartLegend;
}
