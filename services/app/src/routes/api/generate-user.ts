import { createAPIFileRoute } from "@tanstack/react-start/api";
import { json } from "@tanstack/react-start";

import { removeDiacritics } from "@joculdemocratiei/utils";
import { checkRateLimit } from "@/utils/lib";

const USERS_PER_REQUEST = 21;

export const APIRoute = createAPIFileRoute("/api/generate-user")({
  GET: async ({ request }) => {
    const { env, cf } = request.context.cloudflare;

    const rateLimited = await checkRateLimit(request);

    if (rateLimited) {
      return rateLimited;
    }

    const [firstNamesData, lastNamesData, locationsData] = await Promise.all([
      env.GAME_BACKEND.getR2Data("first-names.csv"),
      env.GAME_BACKEND.getR2Data("last-names.csv"),
      env.GAME_BACKEND.getR2Data("locations.csv"),
    ]);

    const linesLocations = locationsData.split("\n").filter(Boolean);
    const dataLocations = linesLocations.slice(1).map((line) => {
      const [city, county, countyCode] = line.split(",");
      return {
        city: city?.trim(),
        county: county?.trim(),
        countyCode: countyCode?.trim(),
      };
    });

    const randomLocation = dataLocations[Math.floor(Math.random() * dataLocations.length)];

    const {
      city: cfCity = randomLocation.city,
      regionCode: cfRegionCode = randomLocation.countyCode as string,
      latitude = "44.42761073708286",
      longitude = "26.087307682667664",
    } = (request.context._platform?.cf || cf || {}) as {
      city: string;
      regionCode: string;
      latitude: string;
      longitude: string;
    };

    const linesFirstNames = firstNamesData
      .split("\n")
      .map((l: string) => l.trim())
      .filter(Boolean);
    const dataFirstNames = linesFirstNames.slice(1);

    const linesLastNames = lastNamesData
      .split("\n")
      .map((l: string) => l.trim())
      .filter(Boolean);
    const dataLastNames = linesLastNames.slice(1);

    const cityWithoutDiacritics = removeDiacritics(cfCity);
    const getRandomCityCounty = () => {
      const exactMatch = dataLocations.find(
        (loc) =>
          loc.city.toLowerCase() === cityWithoutDiacritics?.toLowerCase() &&
          loc.countyCode?.toLowerCase() === cfRegionCode?.toLowerCase(),
      );

      if (exactMatch) {
        return {
          city: exactMatch.city,
          county: exactMatch.county,
          countyCode: exactMatch.countyCode,
        };
      }

      if (cfRegionCode) {
        const citiesInRegion = dataLocations.filter(
          (loc) => loc.countyCode?.toLowerCase() === cfRegionCode.toLowerCase(),
        );
        if (citiesInRegion.length > 0) {
          const randomCity = citiesInRegion[Math.floor(Math.random() * citiesInRegion.length)];
          return {
            city: randomCity.city,
            county: randomCity.county,
            countyCode: randomCity.countyCode,
          };
        }
      }

      const randomLocation = dataLocations[Math.floor(Math.random() * dataLocations.length)];
      return {
        city: randomLocation.city,
        county: randomLocation.county,
        countyCode: randomLocation.countyCode,
      };
    };

    const getRandomName = () => ({
      firstName: dataFirstNames[Math.floor(Math.random() * dataFirstNames.length)],
      lastName: dataLastNames[Math.floor(Math.random() * dataLastNames.length)],
    });

    const users = Array.from({ length: USERS_PER_REQUEST }, () => {
      const { city, county, countyCode } = getRandomCityCounty();
      const { firstName, lastName } = getRandomName();
      const { lat: randomLat, lon: randomLon } = getRandomCoordinates(
        Number(latitude),
        Number(longitude),
      );
      return {
        firstName,
        lastName,
        city,
        county,
        countyCode,
        lat: randomLat,
        lon: randomLon,
      };
    });

    return json({ users });
  },
});

function getRandomCoordinates(lat: number, lon: number) {
  const R = 6371;

  const latRad = (lat * Math.PI) / 180;

  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * 1; // 1km max

  const newLat = lat + (distance / R) * (180 / Math.PI) * Math.cos(angle);
  const newLon = lon + ((distance / R) * (180 / Math.PI) * Math.sin(angle)) / Math.cos(latRad);

  return {
    lat: Number(newLat.toFixed(6)),
    lon: Number(newLon.toFixed(6)),
  };
}
