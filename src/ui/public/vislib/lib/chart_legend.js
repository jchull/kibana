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


export function VislibLibChartLegendProvider(Private) {
  const ErrorHandler = Private(VislibLibErrorHandlerProvider);

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
      this.expanded = this.visConfig.data.uiState.get('vis.legendOpen');

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

      return function (selection) {
        selection.each(function () {
          const vislibChart = d3.select(this);
          vislibChart.style('flex-direction', legendPositionOpts.flexDirection)
            .append('div')
            .attr('class', 'vislib-legend legend-col-wrapper')
            .append('button')
            .attr('class', 'kuiCollapseButton legend-collapse-button')
            .on('click', ()=>self.toggle(self))
            .append('i')
            .attr('class', 'fa ' + (self.expanded ? legendPositionOpts.expandedIconClass : legendPositionOpts.iconClass));

          if(self.expanded) {
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
                // TODO: vislib tooltip wants to be in a viz container, does not seem to work without some changes
                title.append('i')
                  .attr('class', 'fa fa-circle')
                  .style('color', self.data.getColorFunc()(series.label));
                title.append('span') // TODO: needs leading whitespace
                  .text(series.label);
              });
          }

        });
      };
    }




    toggle(target) {
      return target.data.uiState.set('vis.legendOpen', !target.expanded);
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
      return [{ label: 'legend loading...' }];
    }


    destroy() {
      // TODO: clean up

    }
  }

  return ChartLegend;
}
