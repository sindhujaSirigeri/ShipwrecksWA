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
let link = "static/data/Shipwrecks_WAM_002_WA_GDA2020_Public.geojson";

let geojsonLayer;

// Function to create pop-ups with additional fields
function onEachFeature(feature, layer) {
  if (feature.properties) {
    const popupContent = `
      <h3>${feature.properties.name}</h3>
      <p><strong>Country Build:</strong> ${feature.properties.country_bu}</p>
      <p><strong>When built:</strong> ${feature.properties.when_built}</p>
      <p><strong>When lost:</strong> ${feature.properties.when_lost}</p>
      <p><strong>Passengers:</strong> ${feature.properties.passengers}</p>
      <p><strong>Deaths:</strong> ${feature.properties.deaths}</p>
      <p><strong>When found:</strong> ${feature.properties.when_found}</p>
      <p><strong>Industry:</strong> ${feature.properties.industry_1}</p>
      <p><strong>URL:</strong> <a href="${feature.properties.url}" target="_blank">${feature.properties.url}</a></p>
      <p><strong>Region:</strong> ${feature.properties.region}</p>
    `;
    layer.bindPopup(popupContent);
  }
}

// Function to create a marker with a specific icon and color
function createMarkerIcon(icon, color) {
  return L.AwesomeMarkers.icon({
    icon: icon,
    markerColor: color,
    prefix: 'fa' // Using Font Awesome icons
  });
}

// Function to get icon based on industry_1 value
function getIconForIndustry(industry) {
  const iconMap = {
    '': 'circle',
    'Defence': 'anchor',
    'Transport': 'ship',
    'Services': 'briefcase',
    'Fisheries': 'fish',
    'Recreation': 'sailboat'
  };
  if (industry === '' || industry.toLowerCase() === 'unknown') {
    return 'question-circle';
  }
  return iconMap[industry] || 'question-circle';
}

// Function to get color based on industry_1 value
function getColorForIndustry(industry) {
  const colorMap = {
    '': 'lightblue',
    'Defence': 'red',
    'Transport': 'blue',
    'Services': 'green',
    'Fisheries': 'orange',
    'Recreation': 'cadetblue',
  };
  if (industry === '' || industry.toLowerCase() === 'unknown') {
    return 'lightblue';
  }
  return colorMap[industry] || 'gray';
}

// Function to normalize region names
function normalizeRegion(region) {
  if (!region || region.trim() === "" || region.toLowerCase() === "unknown") {
    return "Unknown";
  }
  return region.replace(/\s*\(.*?\)\s*/g, '').trim();
}

// Mapping old region names to new names
const regionNameMapping = {
  "North West": "NORTH WEST COAST",
  "Mid-West": "MID WEST",
  "SW Coast": "SOUTH WEST COAST",
  "Metro": "PERTH METRO",
  "S Coast": "SOUTH COAST"
};

// Function to add the GeoJSON layer to the map
function addGeoJsonLayer(data) {
  if (geojsonLayer) {
    myMap.removeLayer(geojsonLayer);
  }
  geojsonLayer = L.geoJson(data, {
    pointToLayer: function(feature, latlng) {
      const industry = feature.properties.industry_1 || '';
      const markerColor = getColorForIndustry(industry === 'Other' ? '' : industry);
      const markerIcon = getIconForIndustry(industry === 'Other' ? '' : industry);
      return L.marker(latlng, { icon: createMarkerIcon(markerIcon, markerColor) });
    },
    onEachFeature: onEachFeature
  }).addTo(myMap);
}

// Function to filter the GeoJSON data by region, industry, year range, and unknown `when_lost`
function filterData(data, selectedRegion, selectedIndustries, yearRange, includeUnknown) {
  return {
    ...data,
    features: data.features.filter(feature => {
      const region = normalizeRegion(feature.properties.region);
      let industry = feature.properties.industry_1 || '';
      if (industry === 'Other') {
        industry = '';
      }
      const whenLost = feature.properties.when_lost || 'unknown';
      const yearLost = whenLost !== 'unknown' ? parseInt(whenLost) : null;
      const withinYearRange = yearLost ? (yearLost >= yearRange[0] && yearLost <= yearRange[1]) : false;
      return (selectedRegion === "All" || region === selectedRegion) &&
             selectedIndustries.includes(industry) &&
             (withinYearRange || (whenLost === 'unknown' && includeUnknown));
    })
  };
}

// Populate the dropdown with unique regions from the data
function populateRegionFilter(data) {
  const regions = new Set(data.features.map(feature => normalizeRegion(feature.properties.region)));
  const regionFilter = document.getElementById('regionFilter');
  regions.forEach(region => {
    const option = document.createElement('option');
    option.value = region;
    option.text = regionNameMapping[region] || region;
    regionFilter.appendChild(option);
  });
}

// Get selected industries
function getSelectedIndustries() {
  const checkboxes = document.querySelectorAll('#industryFilters input[type=checkbox]');
  return Array.from(checkboxes)
    .filter(checkbox => checkbox.checked)
    .map(checkbox => checkbox.value);
}

// Initialize the slider
const timeSlider = document.getElementById('timeSlider');
noUiSlider.create(timeSlider, {
  start: [1800, 2020],
  connect: true,
  step: 1,
  range: {
    'min': 1800,
    'max': 2020
  },
  format: {
    to: value => Math.round(value),
    from: value => Number(value)
  }
});

// Load the GeoJSON data and initialize the map and filters
d3.json(link).then(function(data) {
  console.log("GeoJSON data loaded:", data);
  addGeoJsonLayer(data);
  populateRegionFilter(data);

  // Add event listener to the region dropdown
  document.getElementById('regionFilter').addEventListener('change', function(e) {
    const selectedRegion = e.target.value;
    const selectedIndustries = getSelectedIndustries();
    const yearRange = timeSlider.noUiSlider.get().map(Number);
    const includeUnknown = document.querySelector('#unknownFilter input[value="unknown"]').checked;
    console.log(`Selected Region: ${selectedRegion}, Selected Industries: ${selectedIndustries}, Year Range: ${yearRange}, Include Unknown: ${includeUnknown}`);
    const filteredData = filterData(data, selectedRegion, selectedIndustries, yearRange, includeUnknown);
    console.log("Filtered Data:", filteredData);
    addGeoJsonLayer(filteredData);
  });

  // Add event listeners to the industry checkboxes
  const industryCheckboxes = document.querySelectorAll('#industryFilters input[type=checkbox]');
  industryCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const selectedRegion = document.getElementById('regionFilter').value;
      const selectedIndustries = getSelectedIndustries();
      const yearRange = timeSlider.noUiSlider.get().map(Number);
      const includeUnknown = document.querySelector('#unknownFilter input[value="unknown"]').checked;
      console.log(`Selected Region: ${selectedRegion}, Selected Industries: ${selectedIndustries}, Year Range: ${yearRange}, Include Unknown: ${includeUnknown}`);
      const filteredData = filterData(data, selectedRegion, selectedIndustries, yearRange, includeUnknown);
      console.log("Filtered Data:", filteredData);
      addGeoJsonLayer(filteredData);
    });
  });

    // Add event listener to the time slider
    timeSlider.noUiSlider.on('update', function(values, handle) {
      const yearRange = values.map(Number);
      document.getElementById('yearRange').innerText = `${yearRange[0]} - ${yearRange[1]}`;
      const selectedRegion = document.getElementById('regionFilter').value;
      const selectedIndustries = getSelectedIndustries();
      const includeUnknown = document.querySelector('#unknownFilter input[value="unknown"]').checked;
      console.log(`Selected Region: ${selectedRegion}, Selected Industries: ${selectedIndustries}, Year Range: ${yearRange}, Include Unknown: ${includeUnknown}`);
      const filteredData = filterData(data, selectedRegion, selectedIndustries, yearRange, includeUnknown);
      console.log("Filtered Data:", filteredData);
      addGeoJsonLayer(filteredData);
    });
  
    // Add event listener to the unknown when_lost checkbox
    document.querySelector('#unknownFilter input[value="unknown"]').addEventListener('change', function() {
      const selectedRegion = document.getElementById('regionFilter').value;
      const selectedIndustries = getSelectedIndustries();
      const yearRange = timeSlider.noUiSlider.get().map(Number);
      const includeUnknown = document.querySelector('#unknownFilter input[value="unknown"]').checked;
      console.log(`Selected Region: ${selectedRegion}, Selected Industries: ${selectedIndustries}, Year Range: ${yearRange}, Include Unknown: ${includeUnknown}`);
      const filteredData = filterData(data, selectedRegion, selectedIndustries, yearRange, includeUnknown);
      console.log("Filtered Data:", filteredData);
      addGeoJsonLayer(filteredData);
    });
  
    // Create and update the legend
    createLegend();
  
  }).catch(function(error) {
    console.error("Error loading GeoJSON data:", error);
  });
  
  // Function to create the legend
  function createLegend() {
    const legend = document.getElementById('legend');
    legend.innerHTML = '<h4>Legend</h4>';
  
    const types = [
      {name: 'No Industry', color: 'lightblue', icon: 'fa-circle'},
      {name: 'Defence', color: 'red', icon: 'fa-anchor'},
      {name: 'Transport', color: 'blue', icon: 'fa-ship'},
      {name: 'Services', color: 'green', icon: 'fa-briefcase'},
      {name: 'Fisheries', color: 'orange', icon: 'fa-fish'},
      {name: 'Recreation', color: 'cadetblue', icon: 'fa-sailboat'}
    ];
  
    types.forEach(type => {
      const item = document.createElement('div');
      const colorBox = document.createElement('i');
      colorBox.style.background = type.color;
      colorBox.className = `fa ${type.icon}`;
      item.appendChild(colorBox);
      item.appendChild(document.createTextNode(` ${type.name}`));
      legend.appendChild(item);
    });
  }
  
