/*
 *     Copyright (c) 2013-2014 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of the observation2poi operator.
 *
 *     observation2poi is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published
 *     by the Free Software Foundation, either version 3 of the License, or (at
 *     your option) any later version.
 *
 *     observation2poi is distributed in the hope that it will be useful, but
 *     WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 *     General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with observation2poi. If not, see <http://www.gnu.org/licenses/>.
 *
 *     Linking this library statically or dynamically with other modules is
 *     making a combined work based on this library.  Thus, the terms and
 *     conditions of the GNU Affero General Public License cover the whole
 *     combination.
 *
 *     As a special exception, the copyright holders of this library give you
 *     permission to link this library with independent modules to produce an
 *     executable, regardless of the license terms of these independent
 *     modules, and to copy and distribute the resulting executable under
 *     terms of your choice, provided that you also meet, for each linked
 *     independent module, the terms and conditions of the license of that
 *     module.  An independent module is a module which is not derived from
 *     or based on this library.  If you modify this library, you may extend
 *     this exception to your version of the library, but you are not
 *     obligated to do so.  If you do not wish to do so, delete this
 *     exception statement from your version.
 *
 */

/*global MashupPlatform*/

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

    icon = internalUrl('images/icon.png');
})();
