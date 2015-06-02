define(function(require, exports, module) {
  'use strict';
  var flight = require('flight');
  var $ = require('jquery');
  var d3 = require('d3');
  // consider removing lodash for jquery comprehensions?
  var _ = require('lodash');

  module.exports = flight.component(function loader() {
    this.onConfig = function onConfig(ev, config) {
      // load the geojson
      if (0) {
        $.getJSON(config.geojson_source, function(data) {
          this.trigger('data', this.processData(data));
        }.bind(this));
      } else {
        d3.csv("/treatment-centers.csv", function(data) {
          // console.log(data[0]);
          this.trigger('data', this.processData(this.csvToGeojson(data)));
        }.bind(this));
      }

    };

    this.csvRowToProperties = function csvRowToProperties(csvRow, searchValues) {
      var properties = {
        "organization_name": csvRow.organization_name,
        "phone_numbers": csvRow["Phone Number"],
        "address": csvRow.address + " " + csvRow.physicalcity + ", Kentucky",
        "city": csvRow.physicalcity
      };

      _.each(searchValues, function(facet, searchValue) {
        if (! properties[facet])  { properties[facet] = []; }
        if (csvRow[searchValue] === "1") {
          properties[facet].push(searchValue);
        }
      });
      return properties;
    };

    this.csvRowToFeature = function csvRowToFeature(csvRow, searchValues) {
      return {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [
            csvRow.lng,
            csvRow.lat
          ]
        },
        "properties": this.csvRowToProperties(csvRow, searchValues)
      };
    };

    this.csvToGeojson = function csvToGeojson(csv) {
      var searchValues = {
        oupatient_offered: "facility_type",
        residential_offered: "facility_type",
        partial_hosp_offered: "out_patient",
        transitional_living_offered: "out_patient",
        peer_services_offered: "out_patient",
        peer_mentoring: "out_patient",
        peer_groups_12steps: "out_patient",
        peer_transitional_living: "out_patient",
        serves_adolescent_females: "age",
        serves_adolescent_males: "age",
        serves_children: "age",
        serves_female_only: "gender",
        serves_male_only: "gender",
        serves_females_males_both: "gender",
        serves_preg_females: "gender",
        serves_faith_based: "other",
        serves_families: "other",
        serves_veterans: "other"
      };
      var features = _.map(csv, function(row) {
        return this.csvRowToFeature(row, searchValues);
      }.bind(this));

      return {
        "type": "FeatureCollection",
        "features": features
      };
    };

    this.processData = function processData(data) {
      // give each feature an ID if it doesn't have one already
      data.features.forEach(function(feature, index) {
        if (!feature.id) {
          feature.id = 'finda-' + index;
        }
      });
      return data;
    };

    this.after('initialize', function() {
      // load the data
      this.on(document, 'config', this.onConfig);
    });
  });
});
