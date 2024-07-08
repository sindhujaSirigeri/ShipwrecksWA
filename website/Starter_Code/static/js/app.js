// URL to the GeoJSON data
let geojsonUrl = "./Shipwrecks_WAM_002_WA_GDA2020_Public.geojson"; 

// Function to build the metadata panel
function buildMetadata(shipwreckName) {
  d3.json(geojsonUrl).then((data) => {
    // Filter the metadata for the object with the desired shipwreck name
    let result = data.features.find(feature => feature.properties.name === shipwreckName).properties;
    
    // Use d3 to select the panel with id of `#sample-metadata`
    let panel = d3.select("#sample-metadata");
    
    // Use `.html("") to clear any existing metadata
    panel.html(""); 
    
    // Define the selected categories
    let selectedCategories = ["when_lost", "where_lost", "lat", "long", "country_bu", "url"];
    
    // Append new tags for each key-value pair in the selected categories
    selectedCategories.forEach((key) => {
      panel.append("h6").text(`${key}: ${result[key]}`);
    });
    
    // Update the shipwreck image if available
    if (result.url) {
      d3.select("#shipwreck-image").attr("src", result.url);
    }

    // Update the map with shipwreck location
    updateMap(result.lat, result.long);
    }
  );
}

// Function to update the map with shipwreck location
function updateMap(lat, lng) {
  // Initialize the map centered at the shipwreck location
  let map = L.map('map').setView([lat, lng], 10);

  // Add tile layer for the map (you can choose different tile providers)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Add a marker at the shipwreck location
  L.marker([lat, lng]).addTo(map)
    .bindPopup('Shipwreck Location')
    .openPopup();
}



// Function to clean and categorize region names
function cleanAndCategorizeRegion(region) {
  // Remove content within parentheses and trim whitespace
  let cleanedRegion = region.replace(/\s*\(.*?\)\s*/g, '').trim();
  
  // Categorize empty regions as "Unknown"
  if (cleanedRegion === "") {
    return "Unknown";
  } else {
    return cleanedRegion;
  }
}

// Function to initialize the dashboard
function init() {
  d3.json(geojsonUrl).then((data) => {
    // Get unique regions
    let regions = [...new Set(data.features.map(feature => cleanAndCategorizeRegion(feature.properties.region)))];
    
    // Use d3 to select the dropdown with id of `#selDataset`
    let regionSelector = d3.select("#selDataset");
    
    // Populate the select options
    regions.forEach((region) => {
      regionSelector.append("option").text(region).property("value", region);
    });
    
    // Get the first region from the list
    let firstRegion = regions[0];
    
    // Populate shipwreck dropdown
    populateShipwreckDropdown(firstRegion);
  });
}

// Function to populate shipwreck dropdown
function populateShipwreckDropdown(region) {
  d3.json(geojsonUrl).then((data) => {
    let shipwrecks = data.features.filter(feature => cleanAndCategorizeRegion(feature.properties.region) === region);
    let shipwreckSelector = d3.select("#shipwreckName");
    
    // Clear existing options
    shipwreckSelector.html("");
    
    // Populate the select options
    shipwrecks.forEach((shipwreck) => {
      shipwreckSelector.append("option").text(shipwreck.properties.name).property("value", shipwreck.properties.name);
    });
    
    // Get the first shipwreck from the list and build its metadata
    let firstShipwreck = shipwrecks[0].properties.name;
    buildMetadata(firstShipwreck);
  });
}

// Event handler for region selection
function optionChanged(region) {
  populateShipwreckDropdown(region);
}

// Event handler for shipwreck selection
function shipwreckChanged(shipwreckName) {
  buildMetadata(shipwreckName);
}

// Initialize the dashboard
init();
