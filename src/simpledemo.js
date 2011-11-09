/** Converts numeric degrees to radians */
if (typeof(Number.prototype.toRad) === "undefined") {
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  }
}

function SimpleDemo(opt) {

  // simplegeo office
  this.lat = window.location.hash.replace("#"+window.location.hash.replace("#","").split("/").reverse().pop()+"/","").split("/").reverse().pop() || 37.772381;
  this.lon = window.location.hash.replace("#"+window.location.hash.replace("#","").split("/").reverse().pop()+"/","").split("/").pop() || -122.405827;
  this.data = {};
  this.options = {
    zoom:window.location.hash.replace("#","").split("/").reverse().pop() || 13,
    zoomRange:[10, 18]
  };
  this.locked, this.draglock = false;
  this.map, this.po, this.geojson, this.startlocation, this.currentfeature = null;
  this.timerstart = null;
  
  // extend options
  for(var o in opt) this.options[o] = opt[o];

   /**
    * This function gets the location, and runs the callback afterwards
    */
    this.getLocation = function(callback) {
      if(this.locked) return;
      this.locked = true;
      this.timerstart = (new Date()).getTime();
      if(typeof(this.options["loading"]) == "function") this.options["loading"].call(this);
      this.client.getLocation({
        "enableHighAccuracy":true
      },(function(cd,callback){ return function(err, position) {
        if (!err) {
          _gaq.push(['_trackEvent', 'Demo', 'Get Location', position.coords.latitude+","+position.coords.longitude]);
          cd.lat = position.coords.latitude;
          cd.lon = position.coords.longitude;
          cd._add_map_center();
          cd.map.center({lat:cd.lat,lon:cd.lon});
        }
        cd.locked = false;
        if(typeof(callback) == "function") callback.call(cd);
        if(typeof(cd.options["loadingDone"]) == "function") cd.options["loadingDone"].call(cd,(new Date()).getTime() - cd.timerstart);
      }})(this,callback))
    };
    
    /**
     * This function initializes the Map polymaps
     */
    this._init_map = function(){
      this.po = org.polymaps;
      this.map = this.po.map()
          .container(this.options['map'].appendChild(this.po.svg("svg")))
          .add(this.po.drag())
          .add(this.po.hash())
          .zoomRange(this.options.zoomRange)
          .zoom(this.options.zoom)
          .center({lat:this.lat,lon:this.lon});

      this.map.add(this.po.image()
          .url(this.po.url("http://{S}tile.cloudmade.com"
          + "/1a1b06b230af4efdbb989ea99e9841af" // http://cloudmade.com/register
          + "/998/256/{Z}/{X}/{Y}.png")
          .hosts(["a.", "b.", "c.", ""])));
          
      this.map.on("move",(function(demo){return function(e){
        if(demo.startlocation==null) {
          demo.startlocation=this.center();
        }
        demo.centerResults(this.center(),demo.options["moveRefresh"]);
      }})(this))
      
      this.geojson = this.po.geoJson();
      this.map.add(this.geojson);
      this.map.add(this.po.compass().pan("none"));
      this.geojson.on("load", (function(cd){return function(e){
        cd._on_geojson_load.call(cd,e);
      }})(this));
      var cent = this.map.center();
      if(cent) {
        this.lat = cent.lat;
        this.lon = cent.lon;
      }
      this._add_map_center();
    };

    /**
     * This function clears all points
     */
    this.clearPoints = function() {
      this.startlocation = null;
      this.currentfeature = null;
      this.geojson.features([]);
      this._add_map_center();
    };
    
    /**
     * This function returns {x,y} the distance the map has moved
     */
     this.distanceMoved = function(location) {
       if(location==null) location = this.map.center();
       if(this.startlocation == null) return { x:0, y:0 };
       var init = this.map.locationPoint(this.startlocation);
       var position = this.map.locationPoint(location);
       return { x:Math.abs(Math.floor(init.x) - Math.floor(position.x)),
        y:Math.abs(Math.floor(init.y) - Math.floor(position.y)) };
     }
     
    /**
     * This function centers the map
     */
     this.centerResults = function(location,callback) {
       var dist = this.distanceMoved(location);
       if (dist.x <= 60 && dist.y <= 60) return;
       this.draglock = true;
       this.startlocation = null;
       var coord = this.map.center();
       this.lat = coord.lat;
       this.lon = coord.lon;
       if(typeof(callback) == "function") callback.call(this);
     };

     /**
      * This function adds the map center point
      */
     this._add_map_center = function() {
       this.map.add(this.geojson.features([{geometry: {coordinates: [this.lon, this.lat], type: "Point"}}]))
     };

}

/**
 * Utils are good for utility stuff :{}
 */
SimpleDemo.utils = {
   distance : function(p1,p2) {
     var R = 6371; // km
     var dLat = (p2['lat']-p1['lat']).toRad();
     var dLon = (p2['lon']-p1['lon']).toRad();
     var lat1 = p1['lat'].toRad();
     var lat2 = p2['lat'].toRad();

     var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
             Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
     var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
     return R * c;
   },
   aproxArea : function(bounds) {
     var delta = bounds[3] - bounds[1];
     return (bounds[2]-bounds[0])*Math.cos(delta*Math.PI/180.0)*delta;
   },
   marker : function() {
     var path = org.polymaps.svg("path");
     path.setAttribute("class", "map-poi");
     path.setAttribute("transform", "translate(0,0)");
     path.setAttribute("d", "M9-16.381l-0.001-0.053c-0.022-1.16-0.28-2.288-0.764-3.351c0,0-0.033-0.073-0.043-0.093l-0.019-0.039"+
     "c-0.044-0.095-0.091-0.188-0.14-0.282l-0.01-0.02c-0.031-0.059-0.061-0.118-0.094-0.176l-0.056-0.099"+
     "c-0.247-0.434-0.532-0.846-0.85-1.232c-0.108-0.132-0.214-0.253-0.324-0.373l-0.013-0.015c-0.039-0.041-0.077-0.082-0.116-0.121"+
     "L6.526-22.28c-0.028-0.028-0.055-0.055-0.082-0.083l-0.082-0.081l-0.067-0.064c-0.033-0.032-0.066-0.063-0.101-0.095l-0.034-0.031"+
     "c-0.045-0.041-0.092-0.083-0.145-0.129c-0.073-0.063-0.147-0.125-0.223-0.187c-0.027-0.022-0.055-0.044-0.082-0.065l-0.016-0.013"+
     "c-0.043-0.034-0.087-0.068-0.13-0.101l-0.011-0.009c-0.036-0.027-0.071-0.054-0.107-0.081c-0.025-0.018-0.05-0.036-0.075-0.053"+
     "l-0.031-0.021c-0.088-0.063-0.178-0.125-0.268-0.185l-0.071-0.047c-0.055-0.036-0.111-0.071-0.167-0.105L4.76-23.677"+
     "c-0.057-0.034-0.114-0.068-0.172-0.102l-0.061-0.034c-0.259-0.146-0.519-0.277-0.772-0.39l-0.027-0.013"+
     "c-0.027-0.012-0.111-0.047-0.111-0.047c-1.092-0.467-2.249-0.715-3.439-0.737L0.122-25c-0.035,0-0.071,0-0.106,0h-0.032"+
     "c-0.035,0-0.071,0-0.106,0l-0.056,0.001c-1.191,0.021-2.348,0.27-3.44,0.737c0,0-0.083,0.036-0.11,0.047l-0.028,0.013"+
     "c-0.25,0.111-0.507,0.241-0.764,0.385l-0.069,0.039c-0.057,0.033-0.113,0.067-0.169,0.1l-0.079,0.048"+
     "C-4.892-23.595-4.946-23.562-5-23.527l-0.077,0.051c-0.087,0.058-0.173,0.117-0.259,0.178l-0.026,0.018"+
     "c-0.028,0.021-0.056,0.041-0.085,0.061c-0.039,0.029-0.078,0.059-0.116,0.088c-0.044,0.034-0.088,0.068-0.138,0.107"+
     "c-0.03,0.024-0.06,0.047-0.09,0.073c-0.076,0.061-0.15,0.124-0.223,0.187l-0.008,0.007c-0.046,0.04-0.092,0.082-0.137,0.123"+
     "l-0.036,0.032c-0.035,0.032-0.07,0.065-0.104,0.098l-0.063,0.06c-0.019,0.019-0.083,0.083-0.083,0.083"+
     "c-0.027,0.027-0.055,0.054-0.081,0.08l-0.042,0.045c-0.04,0.041-0.079,0.081-0.118,0.123l-0.016,0.018"+
     "c-0.105,0.115-0.213,0.239-0.324,0.372c-0.315,0.383-0.6,0.796-0.85,1.234l-0.053,0.094c-0.031,0.054-0.059,0.109-0.087,0.164"+
     "l-0.017,0.033c-0.048,0.093-0.095,0.186-0.14,0.281l-0.019,0.039c-0.009,0.02-0.043,0.093-0.043,0.093"+
     "c-0.484,1.063-0.741,2.19-0.764,3.351c0,0-0.001,0.115-0.001,0.146c0,0,0,0.115,0,0.146l0.001,0.053"+
     "c0.022,1.161,0.28,2.29,0.765,3.354c0,0,0.032,0.07,0.041,0.089l0.02,0.042c0.046,0.097,0.096,0.197,0.154,0.306"+
     "c0.026,0.05,0.053,0.1,0.081,0.149l0.035,0.063c0.009,0.016,0.018,0.033,0.027,0.049l6.34,11.145l0.011,0.019"+
     "c0.01,0.017,0.021,0.033,0.032,0.05c0.006,0.007,0.01,0.016,0.016,0.024c0.019,0.028,0.035,0.058,0.055,0.085"+
     "c0.024,0.031,0.049,0.061,0.074,0.09c0.017,0.021,0.032,0.042,0.05,0.062c0.001,0.002,0.003,0.002,0.004,0.004"+
     "c0.006,0.008,0.014,0.016,0.021,0.023c0.003,0.003,0.006,0.006,0.009,0.009c0.006,0.006,0.011,0.012,0.018,0.018"+
     "C-1.242-0.505-1.237-0.5-1.232-0.495c0.004,0.004,0.008,0.007,0.012,0.012c0.007,0.006,0.014,0.013,0.02,0.02"+
     "c0.003,0.001,0.005,0.003,0.007,0.005c0.009,0.009,0.018,0.016,0.027,0.025c0,0,0,0,0.001,0c0.044,0.038,0.09,0.073,0.137,0.106"+
     "c0.011,0.008,0.023,0.016,0.035,0.023c0.048,0.033,0.099,0.065,0.15,0.092c0,0,0,0,0,0c0.038,0.021,0.077,0.039,0.115,0.057"+
     "c0.002,0,0.004,0.001,0.006,0.002c0.007,0.003,0.014,0.006,0.021,0.009C-0.485-0.051-0.259-0.004-0.035,0c0.003,0,0.007,0,0.011,0"+
     "C-0.016,0-0.007,0,0,0c0.008,0,0.016,0,0.024,0c0.003,0,0.007,0,0.011,0c0.224-0.004,0.451-0.051,0.667-0.143"+
     "c0.007-0.003,0.014-0.006,0.021-0.009c0.002-0.001,0.004-0.001,0.006-0.002c0.093-0.042,0.183-0.092,0.267-0.15"+
     "c0.012-0.007,0.022-0.015,0.033-0.022C1.075-0.36,1.122-0.396,1.166-0.434c0,0,0,0,0,0C1.176-0.443,1.185-0.45,1.194-0.459"+
     "C1.196-0.46,1.197-0.462,1.199-0.464c0.007-0.007,0.015-0.014,0.021-0.02c0.004-0.004,0.008-0.007,0.012-0.011"+
     "C1.237-0.5,1.242-0.505,1.247-0.51c0.006-0.005,0.011-0.011,0.018-0.017c0.002-0.003,0.005-0.007,0.008-0.01"+
     "C1.28-0.544,1.288-0.551,1.294-0.559c0.001-0.001,0.003-0.002,0.004-0.004c0.018-0.02,0.033-0.041,0.05-0.062"+
     "c0.025-0.029,0.051-0.059,0.075-0.091C1.44-0.738,1.454-0.764,1.47-0.789c0.007-0.01,0.014-0.021,0.021-0.031"+
     "c0.012-0.018,0.024-0.036,0.035-0.054l0.011-0.019l6.34-11.145c0.009-0.016,0.067-0.122,0.067-0.122"+
     "c0.026-0.046,0.052-0.093,0.076-0.14c0.058-0.109,0.108-0.209,0.154-0.306l0.02-0.042c0.009-0.02,0.041-0.089,0.041-0.089"+
     "c0.485-1.065,0.743-2.193,0.765-3.354L9-16.144c0-0.032,0-0.063,0-0.095C9-16.238,9-16.35,9-16.381z M0-12.412"+
     "c-2.206,0-3.994-1.736-3.994-3.877S-2.206-20.167,0-20.167s3.994,1.737,3.994,3.878S2.206-12.412,0-12.412z");
     return path;
   },
   circle : function() {
     var path = org.polymaps.svg("circle");
     path.setAttribute("class", "map-poi");
     path.setAttribute("r", 1);
     return path;
   },
   cross : function() {
     var path = org.polymaps.svg("path");
     path.setAttribute("class", "crosshairs");
     path.setAttribute("transform", "translate(0,0)");
     path.setAttribute("d", "M0-12.5c-6.904,0-12.5,5.596-12.5,12.5c0,6.904,5.597,12.5,12.5,12.5c6.903,0,12.5-5.596,12.5-12.5C12.5-6.904,6.904-12.5,0-12.5z M0.86,9.334V5.333h-1.649V9.34c-4.52-0.379-8.138-3.978-8.546-8.49h4.064v-1.65h-4.067c0.385-4.535,4.012-8.16,8.549-8.539v4.058H0.86v-4.053c4.504,0.412,8.096,4.022,8.479,8.534H5.342v1.65h3.993C8.929,5.339,5.348,8.924,0.86,9.334z");
     return path;
   },
   comma : function(num) {
     // turns 12345 into 12,345
     return (""+num).split('').reverse().join('').replace(/(\d{3})/g, "$1,").split('').reverse().join('').replace(/^,/,'');
   }
   
 }

