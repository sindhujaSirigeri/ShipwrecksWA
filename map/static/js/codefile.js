// Initialize the map and set its view to the shipwreck coordinates with a zoom level
let myMap = L.map("map", {
  center: [-25, 125],
  zoom: 5
});

// Adding the tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(myMap);

// Use this link to get the GeoJSON data.
let link = "../static/data/Shipwrecks_WAM_002_WA_GDA2020_Public.geojson";

// Function to create pop-ups with additional fields
function onEachFeature(feature, layer) {
  // Check if the feature has properties
  if (feature.properties) {
    // Customize the pop-up content with the desired fields
    const popupContent = `
      <h3>${feature.properties.name}</h3>
      <p><strong>Country Build:</strong> ${feature.properties.country_bu}</p>
      <p><strong>When built:</strong> ${feature.properties.when_built}</p>
      <p><strong>When lost:</strong> ${feature.properties.when_lost}</p>
      <p><strong>passengers:</strong> ${feature.properties.passengers}</p>
      <p><strong>deaths:</strong> ${feature.properties.deaths}</p>
      <p><strong>when_found:</strong> ${feature.properties.when_found}</p>
      <p><strong>industry:</strong> ${feature.properties.industry_1}</p>
      <p><strong>url:</strong> ${feature.properties.url}</p>
    `;
    // Bind the pop-up to the layer
    layer.bindPopup(popupContent);
  }
}

// Getting our GeoJSON data
d3.json(link).then(function(data) {
  // Creating a GeoJSON layer with the retrieved data and the onEachFeature function
  L.geoJson(data, {
    onEachFeature: onEachFeature
  }).addTo(myMap);
});

