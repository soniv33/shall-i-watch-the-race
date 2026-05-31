// Keyed by OpenF1 `location` (city/circuit city), which is more specific than country
// and avoids the US multi-circuit problem (Austin vs Las Vegas vs Miami).
// Values are Wikimedia Commons Special:FilePath URLs — hotlinking is explicitly permitted.
// Cards fall back gracefully to a dark background if an image is missing or broken.
const IMAGES: Record<string, string> = {
  Melbourne:          "https://commons.wikimedia.org/wiki/Special:FilePath/Albert_Park_circuit_from_air.jpg?width=800",
  Sakhir:             "https://commons.wikimedia.org/wiki/Special:FilePath/Bahrain_International_Circuit_2021.jpg?width=800",
  Jeddah:             "https://commons.wikimedia.org/wiki/Special:FilePath/Jeddah_Corniche_Circuit_2021.jpg?width=800",
  Suzuka:             "https://commons.wikimedia.org/wiki/Special:FilePath/Suzuka_circuit_2005.jpg?width=800",
  Shanghai:           "https://commons.wikimedia.org/wiki/Special:FilePath/Shanghai_International_Circuit_2009.jpg?width=800",
  Miami:              "https://commons.wikimedia.org/wiki/Special:FilePath/Miami_International_Autodrome_2022.jpg?width=800",
  Imola:              "https://commons.wikimedia.org/wiki/Special:FilePath/Autodromo_Enzo_e_Dino_Ferrari.jpg?width=800",
  "Monte Carlo":      "https://commons.wikimedia.org/wiki/Special:FilePath/Monte_Carlo_Formula_1_track_2008.jpg?width=800",
  Barcelona:          "https://commons.wikimedia.org/wiki/Special:FilePath/Circuit_de_Barcelona-Catalunya_2019.jpg?width=800",
  Montreal:           "https://commons.wikimedia.org/wiki/Special:FilePath/Circuit_Gilles_Villeneuve_Montreal_2017.jpg?width=800",
  Spielberg:          "https://commons.wikimedia.org/wiki/Special:FilePath/Red_Bull_Ring_2016.jpg?width=800",
  Silverstone:        "https://commons.wikimedia.org/wiki/Special:FilePath/Silverstone_Circuit_2020.jpg?width=800",
  Budapest:           "https://commons.wikimedia.org/wiki/Special:FilePath/Hungaroring_2016.jpg?width=800",
  "Spa-Francorchamps":"https://commons.wikimedia.org/wiki/Special:FilePath/Spa-Francorchamps_2021.jpg?width=800",
  Zandvoort:          "https://commons.wikimedia.org/wiki/Special:FilePath/Circuit_Zandvoort_2020.jpg?width=800",
  Monza:              "https://commons.wikimedia.org/wiki/Special:FilePath/Autodromo_Nazionale_Monza_from_air_2022.jpg?width=800",
  Baku:               "https://commons.wikimedia.org/wiki/Special:FilePath/Baku_city_circuit_2016.jpg?width=800",
  "Marina Bay":       "https://commons.wikimedia.org/wiki/Special:FilePath/Singapore_Grand_Prix_Circuit.jpg?width=800",
  Austin:             "https://commons.wikimedia.org/wiki/Special:FilePath/Circuit_of_the_Americas_from_air.jpg?width=800",
  "Mexico City":      "https://commons.wikimedia.org/wiki/Special:FilePath/Autodromo_Hermanos_Rodriguez_from_air.jpg?width=800",
  "São Paulo":        "https://commons.wikimedia.org/wiki/Special:FilePath/Autodromo_Jose_Carlos_Pace_from_air.jpg?width=800",
  "Las Vegas":        "https://commons.wikimedia.org/wiki/Special:FilePath/Las_Vegas_Strip_Circuit_2023.jpg?width=800",
  Lusail:             "https://commons.wikimedia.org/wiki/Special:FilePath/Losail_International_Circuit_from_air.jpg?width=800",
  "Abu Dhabi":        "https://commons.wikimedia.org/wiki/Special:FilePath/Yas_Marina_Circuit_2021.jpg?width=800",
};

export function getCircuitImage(location: string, country?: string): string | undefined {
  return IMAGES[location] ?? (country ? IMAGES[country] : undefined);
}
