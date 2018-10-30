import * as Color from "color";
import * as GoogleMapsLoader from "google-maps";
import * as React from "react";

const DefaultCenter = { lat: 56.263, lng: 9.501 };
const mapElement = document.getElementById("map");

(GoogleMapsLoader as any).KEY = "AIzaSyCaQF9rGGRc8HPoGN8I0zMjsPggexfxB0o";
(GoogleMapsLoader as any).LANGUAGE = "lt";
(GoogleMapsLoader as any).REGION = "LT";
const initialGeo =
  "https://raw.githubusercontent.com/vincaslt/maps-hak/36b684b71c1e4f3347c12e204601edddcf8fc483/bolighed.geojson";
const zoomedGeo =
  "https://raw.githubusercontent.com/vincaslt/maps-hak/ad6914af76bd4574a90ecd58d5dd7d2d287bc081/denmark-municipalities.geojson";

interface ICoordinates {
  lat: number;
  lng: number;
}

interface IPoint {
  id: string;
  lon: number;
  lan: number;
  color: "Red" | "Green" | "Yellow";
  affordability: number;
  municipality: string;
}

function getData(budget: string | null) {
  return {
    allPoints: require(`./data/${budget || 1}/all-points.json`),
    zoomed: require(`./data/${budget || 1}/zoomed.json`),
    initial: require(`./data/${budget || 1}/initial.json`)
  };
}

function processPoints(geometry: any, callback: any, thisArg: any) {
  if (geometry instanceof google.maps.LatLng) {
    callback.call(thisArg, geometry);
  } else if (geometry instanceof google.maps.Data.Point) {
    callback.call(thisArg, geometry.get());
  } else {
    geometry
      .getArray()
      .forEach((g: any) => processPoints(g, callback, thisArg));
  }
}

const setStyle = (map: google.maps.Map, areas: any) => {
  map.data.setStyle(feature => {
    const name = feature.getProperty("n") || feature.getProperty("name");
    const hue = areas[name].color;
    const color = hue
      ? Color()
          .hue(hue)
          .saturationl(100 - hue * 0.125)
          .lightness(45)
      : Color("rgb(120, 120, 120)");
    return {
      fillColor: color.string(),
      strokeWeight: 1,
      strokeColor: color.darken(0.35).string(),
      fillOpacity: 0.75
    };
  });
};

const mouseOver = (map: google.maps.Map, areas: any) => (e: any) => {
  map.data.revertStyle();
  map.data.overrideStyle(e.feature, { fillOpacity: 1 });

  // update the label
  const name = e.feature.getProperty("n") || e.feature.getProperty("name");
  const greens = areas[name].greens;
  const reds = areas[name].reds;
  const yellows = areas[name].yellows;
  console.log(areas[name]);
  console.log(greens, reds, yellows);
  const hue = areas[name].color;
  (document.getElementById("data-label") as HTMLElement).textContent = name;
  (document.getElementById("data-caret") as HTMLElement).style.paddingLeft =
    (hue / 120) * 100 + "%";
  (document.getElementById("data-box") as HTMLElement).style.display = "block";
  (document.getElementById("affordability-box") as HTMLElement).style.display =
    "block";
  (document.getElementById(
    "green"
  ) as HTMLElement).textContent = `Affordable homes: ${greens}`;
  (document.getElementById(
    "yellow"
  ) as HTMLElement).textContent = `Risky: ${yellows}`;
  (document.getElementById(
    "red"
  ) as HTMLElement).textContent = `Not affordable homes: ${reds}`;
};

const loadMaps = (center: ICoordinates) => {
  GoogleMapsLoader.load(google => {
    const map = new google.maps.Map(mapElement, {
      center,
      zoom: 7,
      mapTypeControl: false
    });
    const budget = new URLSearchParams(window.location.search).get("budget");
    const data = getData(budget);

    map.data.loadGeoJson(initialGeo);
    setStyle(map, data.initial);

    const listener = map.data.addListener(
      "mouseover",
      mouseOver(map, data.initial)
    );

    map.data.addListener("click", event => {
      const bounds = new google.maps.LatLngBounds();
      processPoints(event.feature.getGeometry(), bounds.extend, bounds);

      const currentZoom = map.getZoom();
      // first zooom
      if (currentZoom <= 7) {
        map.fitBounds(bounds);
        map.setZoom(9);
        setTimeout(() => {
          map.data.forEach(feature => map.data.remove(feature));
          map.data.loadGeoJson(zoomedGeo);
          setStyle(map, data.zoomed);
          listener.remove();

          map.data.addListener("mouseover", mouseOver(map, data.zoomed));
        }, 10);
      } else if (currentZoom <= 9) {
        // second zoom
        map.fitBounds(bounds);
        map.setZoom(12);
        console.log(event);
        const name =
          event.feature.getProperty("n") || event.feature.getProperty("name");

        const municipalityPoints = (data.allPoints as IPoint[]).filter(
          (p: IPoint) => p.municipality === name
        );
        municipalityPoints.map((p: IPoint) => {
          return new google.maps.Marker({
            position: { lat: Number(p.lan), lng: Number(p.lon) },
            icon: `/${p.color}.png`,
            map
          });
        });
        setTimeout(() => {
          map.data.forEach(feature => map.data.remove(feature));
        });
      }
    });
  });
};

loadMaps(DefaultCenter);

class Map extends React.Component {
  public render() {
    return <></>;
  }
}

export default Map;
