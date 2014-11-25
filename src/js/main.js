/*
 * Copyright (c) 2014 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* globals MashupPlatform*/

(function () {

    "use strict";

    var icon,
        GEOJSON_POINT_RE = new RegExp('POINT\\s*\\(\\s*([+-]?\\d+(\\.\\d+)?),?\\s*([+-]?\\d+(\\.\\d+)?)\\)');

    var readAttr = function readAttr(entity, attr) {
        var parts = attr.split('.');
        var value = entity[parts[0]];
        for (var i = 1; i < parts.length; i++) {
            value = value[parts[i]];
        }
        return value;
    };

    var singleAttr = function singleAttr(value) {
        var coord_parts;

        if (typeof value === 'object') {
            return value;
        } else {
            coord_parts = value.match(GEOJSON_POINT_RE);
            if (coord_parts != null) {
                return {
                    lat: parseFloat(coord_parts[3]),
                    lng: parseFloat(coord_parts[1])
                };
            } else {
                coord_parts = value.split(new RegExp(',\\s*'));
                return {
                    lat: parseFloat(coord_parts[0]),
                    lng: parseFloat(coord_parts[1])
                };
            }
        }
    };

    var topoi = function topoi(entity) {
        var coordinates = null;
        var coordinates_pref = MashupPlatform.prefs.get('coordinates_attr');
        var attributes = coordinates_pref.split(new RegExp(',\\s*'));
        var value = null;

        if (attributes.length < 1) {
            return;
        } else if (attributes.length >= 2 && entity[attributes[0]] != null && entity[attributes[1]] != null) {
            coordinates = {
                lat: parseFloat(readAttr(entity, attributes[0])),
                lng: parseFloat(readAttr(entity, attributes[1]))
            };
        } else if ((value = readAttr(entity, attributes[0]))) {
            coordinates = singleAttr(value);
        }

        if (coordinates) {
            coordinates.system = "WGS84";
            MashupPlatform.wiring.pushEvent("poiOutput", JSON.stringify(entity2poi(entity, coordinates)));
        }
    };

    MashupPlatform.wiring.registerCallback("entityInput", function (entityString) {
        var data = JSON.parse(entityString).data;
        for (var i = 0; i < data.length; i++) {
            topoi(data[i]);
        }
    });

    var entity2poi = function entity2poi(entity, coordinates) {
        var poi = {
            id: "" + entity._id,
            icon: icon,
            tooltip: "" + entity._id,
            data: entity,
            infoWindow: buildInfoWindow.call(this, entity),
            currentLocation: coordinates
        };

        return poi;
    };

    var internalUrl = function internalUrl(data) {
        var url = document.createElement("a");
        url.setAttribute('href', data);
        return url.href;
    };

    var buildInfoWindow = function buildInfoWindow(entity) {
        var infoWindow = "<div>";
        for (var attr in entity) {
            infoWindow += '<span style="font-size:12px;"><b>' + attr + ": </b> " + entity[attr] +  "</span><br />";
        }
        infoWindow += "</div>";

        return infoWindow;
    };

    var updateMarkerIcon = function updateMarkerIcon() {
        icon = MashupPlatform.prefs.get('marker-icon');
        if (icon == '') {
            icon = internalUrl('images/icon.png');
        }
    };

    MashupPlatform.prefs.registerCallback(updateMarkerIcon);
    // Init initial marker icon
    updateMarkerIcon();

})();
